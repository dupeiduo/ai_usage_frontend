import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { apiPost } from '../api'

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

    // Call the real AI chat API
    const callAiApi = async (userMessage: string): Promise<string> => {
        const res = await apiPost('/api/chat/send', { message: userMessage })
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: '请求失败' }))
            throw new Error(err.detail || `API error: ${res.status}`)
        }
        const data = await res.json()
        return data.content
    }

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

        // Update conversation with user message
        setConversations((prev) =>
            prev.map((conv) => {
                if (conv.id !== activeConvId) return conv
                // Auto-title from first message
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

        try {
            const replyText = await callAiApi(text)

            const assistantMsg: Message = {
                id: createId(),
                role: 'assistant',
                content: replyText,
                timestamp: Date.now(),
            }

            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.id !== activeConvId) return conv
                    return {
                        ...conv,
                        messages: [...conv.messages, assistantMsg],
                    }
                }),
            )
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
                        <div className="chat-messages">
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
                                            <div className="chat-bubble-text">{msg.content}</div>
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
