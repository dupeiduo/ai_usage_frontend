import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { apiGet, apiPost } from '../api'

type Contact = {
    id: number
    name: string
    phone: string
    email?: string
    address?: string
    social_account?: string
}

type ContactForm = Omit<Contact, 'id'>

const initialContactForm: ContactForm = {
    name: '',
    phone: '',
    email: '',
    address: '',
    social_account: '',
}

const ContactsPage = () => {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [search, setSearch] = useState('')
    const [form, setForm] = useState<ContactForm>(initialContactForm)
    const [editId, setEditId] = useState<number | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 10
    const [total, setTotal] = useState<number | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [message, setMessage] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showMessage = (msg: string) => {
        setMessage(msg)
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setMessage(''), 3000)
    }

    const clearMessage = () => {
        setMessage('')
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current)
            toastTimerRef.current = null
        }
    }

    useEffect(() => {
        let mounted = true

        const load = async () => {
            setLoading(true)
            setError('')

            try {
                const url = `/api/contact/list?page=${page}&page_size=${pageSize}`
                const res = await apiGet(url)
                if (!res.ok) {
                    throw new Error(`请求失败: ${res.status}`)
                }

                const data = await res.json()
                if (mounted) {
                    setContacts(data?.items ?? [])
                    if (typeof data?.total === 'number') setTotal(data.total)
                }
            } catch (err) {
                if (mounted) {
                    setContacts([])
                    setError(err instanceof Error ? err.message : String(err))
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()

        return () => {
            mounted = false
        }
    }, [page, pageSize, refreshKey])

    const filteredContacts = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return contacts

        return contacts.filter((item) => {
            return (
                item.name.toLowerCase().includes(query) ||
                item.phone.toLowerCase().includes(query) ||
                item.email?.toLowerCase().includes(query) ||
                item.address?.toLowerCase().includes(query) ||
                item.social_account?.toLowerCase().includes(query)
            )
        })
    }, [contacts, search])

    const resetForm = () => {
        setForm(initialContactForm)
        setEditId(null)
        clearMessage()
    }

    const handleFormChange = (field: keyof ContactForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        clearMessage()
        setError('')

        if (!form.name.trim() || !form.phone.trim()) {
            showMessage('姓名和电话为必填项。')
            return
        }

        const endpoint =
            modalMode === 'create'
                ? '/api/contact/create'
                : `/api/contact/update?contact_id=${editId}`

        try {
            setLoading(true)
            const res = await apiPost(endpoint, form)

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                const errorText = data?.message || `保存失败：${res.status}`
                throw new Error(errorText)
            }

            const result = await res.json().catch(() => null)
            showMessage(modalMode === 'create' ? '联系人已新增。' : '联系人已更新。')
            setIsModalOpen(false)
            resetForm()
            setRefreshKey((prev) => prev + 1)

            if (modalMode === 'create' && result?.item?.id) {
                setPage(1)
            }
        } catch (err) {
            showMessage(err instanceof Error ? err.message : '保存失败，请稍后重试。')
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        resetForm()
        setModalMode('create')
        setIsModalOpen(true)
    }

    const openEditModal = (contact: Contact) => {
        setForm({
            name: contact.name,
            phone: contact.phone,
            email: contact.email ?? '',
            address: contact.address ?? '',
            social_account: contact.social_account ?? '',
        })
        setEditId(contact.id)
        setModalMode('edit')
        setIsModalOpen(true)
        clearMessage()
    }

    const confirmDelete = (contact: Contact) => {
        setDeleteTarget(contact)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        clearMessage()
        setError('')
        try {
            const res = await apiGet(`/api/contact/delete?contact_id=${deleteTarget.id}`)
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                const errorText = data?.message || `删除失败：${res.status}`
                throw new Error(errorText)
            }

            if (editId === deleteTarget.id) {
                resetForm()
            }
            showMessage('联系人已删除。')
            setDeleteTarget(null)
            setRefreshKey((prev) => prev + 1)
        } catch (err) {
            showMessage(err instanceof Error ? err.message : '删除失败，请稍后重试。')
            setDeleteTarget(null)
        }
    }

    return (
        <section className="page-card contacts-page">
            <div className="contacts-grid">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-row">
                            <h2>通讯录管理</h2>
                            <button type="button" className="primary-button" onClick={openCreateModal}>
                                新增联系人
                            </button>
                        </div>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="搜索姓名、电话、邮箱、地址或社交账号"
                        />
                    </div>

                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>姓名</th>
                                    <th>电话</th>
                                    <th>邮箱</th>
                                    <th>地址</th>
                                    <th>社交账号</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="empty-row">
                                            未找到联系人，请尝试更改搜索条件或新增联系人。
                                        </td>
                                    </tr>
                                ) : (
                                    filteredContacts.map((contact) => (
                                        <tr key={contact.id}>
                                            <td>{contact.id}</td>
                                            <td>{contact.name}</td>
                                            <td>{contact.phone}</td>
                                            <td>{contact.email || '-'}</td>
                                            <td>{contact.address || '-'}</td>
                                            <td>{contact.social_account || '-'}</td>
                                            <td>
                                                <button type="button" onClick={() => openEditModal(contact)}>
                                                    编辑
                                                </button>
                                                <button type="button" className="danger" onClick={() => confirmDelete(contact)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-controls">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
                            上一页
                        </button>
                        <span className="page-info">第 {page} 页</span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loading || (total !== null && page * pageSize >= total)}
                        >
                            下一页
                        </button>
                        <span className="page-info">每页 {pageSize} 条</span>
                        {total !== null && <span className="page-info">共 {total} 条</span>}
                        {error && <span className="error-text">{error}</span>}
                    </div>
                </div>
            </div>

            {message && (
                <div className="message-box">
                    <span>{message}</span>
                    <button type="button" className="toast-close" onClick={clearMessage}>×</button>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === 'create' ? '新增联系人' : '编辑联系人'}</h2>
                            <button type="button" className="close-button" onClick={() => setIsModalOpen(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="contact-form">
                            <label>
                                姓名 <span className="required">*</span>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    placeholder="请输入姓名"
                                    required
                                />
                            </label>
                            <label>
                                电话 <span className="required">*</span>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => handleFormChange('phone', e.target.value)}
                                    placeholder="请输入电话"
                                    required
                                />
                            </label>
                            <label>
                                邮箱
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    placeholder="请输入邮箱"
                                />
                            </label>
                            <label>
                                地址
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => handleFormChange('address', e.target.value)}
                                    placeholder="请输入地址"
                                />
                            </label>
                            <label>
                                社交账号
                                <input
                                    type="text"
                                    value={form.social_account}
                                    onChange={(e) => handleFormChange('social_account', e.target.value)}
                                    placeholder="请输入社交账号"
                                />
                            </label>
                            <div className="form-actions">
                                <button className="primary-button" type="submit" disabled={loading}>
                                    {loading ? '保存中...' : '保存联系人'}
                                </button>
                                <button type="button" className="secondary-button" onClick={resetForm}>
                                    重置表单
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="confirm-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>确认删除</h3>
                        <p>
                            确定要删除联系人 <strong>{deleteTarget.name}</strong>（{deleteTarget.phone}）吗？此操作不可撤销。
                        </p>
                        <div className="confirm-actions">
                            <button type="button" className="secondary-button" onClick={() => setDeleteTarget(null)}>
                                取消
                            </button>
                            <button type="button" className="primary-button" style={{ background: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }} onClick={handleDelete}>
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ContactsPage