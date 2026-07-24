import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

type Role = 'user' | 'assistant'

interface Message {
    id: string
    role: Role
    content: string
    timestamp: number
}

interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: number
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const ChatPage = () => {
    const [conversations, setConversations] = useState<Conversation[]>(() => {
        const saved = localStorage.getItem('ai-chat-conversations')
        return saved ? JSON.parse(saved) : []
    })
    const [activeConvId, setActiveConvId] = useState<string | null>(() => {
        const saved = localStorage.getItem('ai-chat-active')
        return saved || null
    })
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('ai-chat-conversations', JSON.stringify(conversations))
    }, [conversations])

    useEffect(() => {
        if (activeConvId) {
            localStorage.setItem('ai-chat-active', activeConvId)
        } else {
            localStorage.removeItem('ai-chat-active')
        }
    }, [activeConvId])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversations, activeConvId])

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }, [input])

    const activeConv = activeConvId
        ? conversations.find((c) => c.id === activeConvId) ?? null
        : null

    const messages = activeConv?.messages ?? []

    // Inject copy buttons into code blocks after messages render
    const messagesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = messagesRef.current
        if (!container) return

        const wrappers = container.querySelectorAll<HTMLElement>('.code-block-wrapper:not(.has-copy-btn)')
        wrappers.forEach((wrapper) => {
            wrapper.classList.add('has-copy-btn')
            const btn = document.createElement('button')
            btn.className = 'code-copy-btn'
            btn.title = '复制代码'
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
            wrapper.appendChild(btn)
        })
    }, [messages])

    const handleCopyCode = (target: HTMLElement) => {
        const pre = target.closest('.code-block-wrapper')?.querySelector('pre')
        if (!pre) return
        const code = pre.textContent || ''
        navigator.clipboard.writeText(code).then(() => {
            target.classList.add('copied')
            target.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            setTimeout(() => {
                target.classList.remove('copied')
                target.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
            }, 2000)
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea')
            textarea.value = code
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        })
    }

    const startNewChat = () => {
        const newConv: Conversation = {
            id: createId(),
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
        }
        setConversations((prev) => [newConv, ...prev])
        setActiveConvId(newConv.id)
    }

    const deleteConversation = (id: string) => {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeConvId === id) {
            const remaining = conversations.filter((c) => c.id !== id)
            setActiveConvId(remaining.length > 0 ? remaining[0].id : null)
        }
    }

    // Simple markdown-to-HTML renderer (supports images, bold, code, links)
    const renderMarkdown = useCallback((text: string): string => {
        // Escape HTML first
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

        // --- Extract code blocks first so their inner newlines survive ---
        const codeBlocks: string[] = []
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
            const idx = codeBlocks.length
            codeBlocks.push(
                `<div class="code-block-wrapper"><pre class="has-copy-btn"><code class="language-${lang}">${code.trim()}</code></pre></div>`
            )
            return `\x00CODEBLOCK${idx}\x00`
        })

        // Inline code `...`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

        // Images ![alt](url)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
            '<img src="$2" alt="$1" class="chat-img" loading="lazy" />')

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

        // Bold **text**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
        html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
        html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')

        // Unordered lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>')

        // Paragraphs (double newline)
        html = html.replace(/\n\n/g, '</p><p>')
        html = '<p>' + html + '</p>'

        // Single newlines within paragraphs
        html = html.replace(/\n/g, '<br/>')

        // --- Restore code blocks (preserving inner newlines) ---
        html = html.replace(/\x00CODEBLOCK(\d+)\x00/g, (_m, idx) => codeBlocks[Number(idx)])

        return html
    }, [])

    // Get auth token for streaming fetch
    const getToken = () => localStorage.getItem('authToken')

    const handleSend = async () => {
        const text = input.trim()
        if (!text || sending || !activeConvId) return

        setInput('')
        setSending(true)

        const userMsg: Message = {
            id: createId(),
            role: 'user',
            content: text,
            timestamp: Date.now(),
        }

        // Build conversation history (last 20 messages) for context
        const historyMessages = activeConv
            ? activeConv.messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
            : []

        // Update conversation with user message
        setConversations((prev) =>
            prev.map((conv) => {
                if (conv.id !== activeConvId) return conv
                const title =
                    conv.messages.length === 0
                        ? text.slice(0, 30) + (text.length > 30 ? '...' : '')
                        : conv.title
                return {
                    ...conv,
                    title,
                    messages: [...conv.messages, userMsg],
                }
            }),
        )

        // Prepare for streaming
        let streamedContent = ''
        let assistantId = ''

        try {
            const token = getToken()
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const res = await fetch('/api/chat/send-stream', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    messages: historyMessages,
                    message: text,
                }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: '请求失败' }))
                throw new Error(err.detail || `API error: ${res.status}`)
            }

            const reader = res.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })

                // SSE events are separated by \n\n
                const parts = buffer.split('\n\n')
                buffer = parts.pop() || ''

                for (const part of parts) {
                    const lines = part.split('\n')
                    let eventType = ''
                    let eventData = ''

                    for (const line of lines) {
                        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
                        else if (line.startsWith('data: ')) eventData = line.slice(6)
                    }

                    if (eventType === 'meta' && eventData) {
                        try {
                            const meta = JSON.parse(eventData)
                            assistantId = meta.id
                            setConversations((prev) =>
                                prev.map((conv) => {
                                    if (conv.id !== activeConvId) return conv
                                    return {
                                        ...conv,
                                        messages: [...conv.messages, {
                                            id: meta.id,
                                            role: 'assistant',
                                            content: '',
                                            timestamp: meta.timestamp,
                                        }],
                                    }
                                }),
                            )
                        } catch { /* ignore */ }
                    } else if (eventType === 'error' && eventData) {
                        try {
                            const err = JSON.parse(eventData)
                            throw new Error(err.detail || 'Stream error')
                        } catch (e) {
                            if (e instanceof Error && e.message !== 'Stream error') throw e
                            throw new Error('Stream error')
                        }
                    } else if (eventData) {
                        try {
                            const payload = JSON.parse(eventData)
                            if (payload.content) {
                                streamedContent += payload.content
                                setConversations((prev) =>
                                    prev.map((conv) => {
                                        if (conv.id !== activeConvId) return conv
                                        return {
                                            ...conv,
                                            messages: conv.messages.map((m) =>
                                                m.id === assistantId
                                                    ? { ...m, content: streamedContent }
                                                    : m
                                            ),
                                        }
                                    }),
                                )
                            }
                        } catch { /* ignore non-JSON data (e.g. [DONE]) */ }
                    }
                }
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : '未知错误'
            // Append error as assistant message if nothing streamed
            if (!streamedContent) {
                const fallbackId = assistantId || createId()
                setConversations((prev) =>
                    prev.map((conv) => {
                        if (conv.id !== activeConvId) return conv
                        const hasPlaceholder = conv.messages.some(m => m.id === fallbackId)
                        if (hasPlaceholder) {
                            return {
                                ...conv,
                                messages: conv.messages.map((m) =>
                                    m.id === fallbackId ? { ...m, content: `❌ 错误：${errorMsg}` } : m
                                ),
                            }
                        }
                        return {
                            ...conv,
                            messages: [...conv.messages, {
                                id: fallbackId,
                                role: 'assistant',
                                content: `❌ 错误：${errorMsg}`,
                                timestamp: Date.now(),
                            }],
                        }
                    }),
                )
            }
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const formatTime = (ts: number) => {
        const d = new Date(ts)
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }

    return (
        <section className="chat-page">
            {/* Sidebar */}
            <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="chat-sidebar-header">
                    <button className="new-chat-btn" onClick={startNewChat}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        新对话
                    </button>
                </div>
                <div className="chat-conv-list">
                    {conversations.length === 0 ? (
                        <div className="chat-conv-empty">暂无对话记录</div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`chat-conv-item ${conv.id === activeConvId ? 'active' : ''}`}
                                onClick={() => setActiveConvId(conv.id)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-conv-icon">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <span className="chat-conv-title">{conv.title}</span>
                                <button
                                    className="chat-conv-delete"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteConversation(conv.id)
                                    }}
                                    title="删除对话"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <div className="chat-sidebar-footer">
                    <button className="chat-sidebar-toggle" onClick={() => setSidebarOpen(false)} title="收起侧栏">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Collapsed sidebar trigger */}
            {!sidebarOpen && (
                <button className="chat-sidebar-open-btn" onClick={() => setSidebarOpen(true)} title="展开侧栏">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>
            )}

            {/* Main Chat Area */}
            <div className="chat-main">
                {!activeConv ? (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <h1>AI 智能助手</h1>
                        <p>点击左侧「新对话」开始聊天，或选择一个已有的对话。</p>
                        <button className="primary-button" onClick={startNewChat}>
                            开始新对话
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div
                            className="chat-messages"
                            ref={messagesRef}
                            onClick={(e) => {
                                const target = e.target as HTMLElement
                                if (target.closest('.code-copy-btn')) {
                                    handleCopyCode(target.closest('.code-copy-btn') as HTMLElement)
                                }
                            }}
                        >
                            {messages.length === 0 ? (
                                <div className="chat-empty-hint">
                                    <p>发送一条消息开始对话</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`chat-message ${msg.role}`}>
                                        <div className="chat-avatar">
                                            {msg.role === 'assistant' ? (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                                    <path d="M3 21v-2a4 4 0 0 1 4-4h.5" />
                                                    <circle cx="18" cy="15" r="3" />
                                                    <path d="M20.2 20.2 22 22" />
                                                    <path d="M15 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
                                                </svg>
                                            ) : (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="chat-bubble">
                                            <div
                                                className="chat-bubble-text"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                            />
                                            <div className="chat-bubble-time">{formatTime(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {sending && (
                                <div className="chat-message assistant">
                                    <div className="chat-avatar">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                            <path d="M3 21v-2a4 4 0 0 1 4-4h.5" />
                                            <circle cx="18" cy="15" r="3" />
                                            <path d="M20.2 20.2 22 22" />
                                            <path d="M15 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
                                        </svg>
                                    </div>
                                    <div className="chat-bubble">
                                        <div className="typing-indicator">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="chat-input-area">
                            <div className="chat-input-wrapper">
                                <textarea
                                    ref={textareaRef}
                                    className="chat-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
                                    rows={1}
                                    disabled={sending}
                                />
                                <button
                                    className="chat-send-btn"
                                    onClick={handleSend}
                                    disabled={!input.trim() || sending}
                                    title="发送"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                            <p className="chat-disclaimer">AI 助手可能会产生不准确的信息，请注意甄别。</p>
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}

export default ChatPage
