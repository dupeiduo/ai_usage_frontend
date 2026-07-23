import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

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

const localStorageKey = 'address-book-contacts'

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
    const [pageSize, _setPageSize] = useState(10)
    const [total, setTotal] = useState<number | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [message, setMessage] = useState('')

    useEffect(() => {
        let mounted = true

        const load = async () => {
            setLoading(true)
            setError('')

            try {
                const url = `/api/contact/list?page=${page}&page_size=${pageSize}`
                const res = await fetch(url, { method: 'GET' })
                if (!res.ok) {
                    throw new Error(`请求失败: ${res.status}`)
                }

                const data = await res.json()
                // 适配返回格式：{ page, page_size, total, items }
                const list: Contact[] = data?.items ?? []
                const resTotal: number | undefined = data?.total

                if (mounted && list && list.length > 0) {
                    setContacts(list)
                    window.localStorage.setItem(localStorageKey, JSON.stringify(list))
                    if (typeof resTotal === 'number') setTotal(resTotal)
                    return
                }

                // 如果接口返回为空，则回退到 localStorage 或示例数据
                const stored = window.localStorage.getItem(localStorageKey)
                if (mounted && stored) {
                    setContacts(JSON.parse(stored))
                    return
                }

                if (mounted) {
                    setContacts([
                        {
                            id: 1,
                            name: '张三',
                            phone: '13800000000',
                            email: 'zhangsan@example.com',
                            address: '北京市朝阳区',
                            social_account: '@zhangsan',
                        },
                        {
                            id: 2,
                            name: '李四',
                            phone: '13900000001',
                            email: 'lisi@example.com',
                            address: '上海市浦东新区',
                            social_account: '@lisi',
                        },
                    ])
                }
            } catch (err) {
                if (mounted) {
                    const stored = window.localStorage.getItem(localStorageKey)
                    if (stored) {
                        setContacts(JSON.parse(stored))
                    } else {
                        setContacts([
                            {
                                id: 1,
                                name: '张三',
                                phone: '13800000000',
                                email: 'zhangsan@example.com',
                                address: '北京市朝阳区',
                                social_account: '@zhangsan',
                            },
                            {
                                id: 2,
                                name: '李四',
                                phone: '13900000001',
                                email: 'lisi@example.com',
                                address: '上海市浦东新区',
                                social_account: '@lisi',
                            },
                        ])
                    }

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

    useEffect(() => {
        window.localStorage.setItem(localStorageKey, JSON.stringify(contacts))
    }, [contacts])

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
        setMessage('')
    }

    const handleFormChange = (field: keyof ContactForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setMessage('')
        setError('')

        if (!form.name.trim() || !form.phone.trim()) {
            setMessage('姓名和电话为必填项。')
            return
        }

        const endpoint =
            modalMode === 'create'
                ? '/api/contact/create'
                : `/api/contact/update?contact_id=${editId}`

        try {
            setLoading(true)
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                const errorText = data?.message || `保存失败：${res.status}`
                throw new Error(errorText)
            }

            const result = await res.json().catch(() => null)
            setMessage(modalMode === 'create' ? '联系人已新增。' : '联系人已更新。')
            setIsModalOpen(false)
            resetForm()
            setRefreshKey((prev) => prev + 1)

            if (modalMode === 'create' && result?.item?.id) {
                setPage(1)
            }
        } catch (err) {
            setMessage(err instanceof Error ? err.message : '保存失败，请稍后重试。')
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
        setMessage('')
    }

    const handleDelete = async (id: number) => {
        setMessage('')
        setError('')
        try {
            const res = await fetch(`/api/contact/delete?contact_id=${id}`, {
                method: 'GET',
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                const errorText = data?.message || `删除失败：${res.status}`
                throw new Error(errorText)
            }

            if (editId === id) {
                resetForm()
            }
            setMessage('联系人已删除。')
            setRefreshKey((prev) => prev + 1)
        } catch (err) {
            setMessage(err instanceof Error ? err.message : '删除失败，请稍后重试。')
        }
    }

    return (
        <section className="page-card contacts-page">
            <div className="page-header">
                <h1 className="page-title">通讯录管理</h1>
                <p className="page-description">
                    支持查看列表、搜索、新增、编辑、删除。数据保存在本地浏览器中。
                </p>
            </div>

            <div className="contacts-grid">
                <div className="panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <h2>联系人列表</h2>
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
                                            <td>{contact.email || '-'} </td>
                                            <td>{contact.address || '-'} </td>
                                            <td>{contact.social_account || '-'} </td>
                                            <td>
                                                <button type="button" onClick={() => openEditModal(contact)}>
                                                    编辑
                                                </button>
                                                <button type="button" className="danger" onClick={() => handleDelete(contact.id)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination-controls" style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
                            上一页
                        </button>
                        <div>第 {page} 页</div>
                        <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loading || (total !== null && page * pageSize >= total)}
                        >
                            下一页
                        </button>
                        <div style={{ marginLeft: 12 }}>
                            每页 {pageSize} 条
                        </div>
                        {total !== null && <div style={{ marginLeft: 12 }}>共 {total} 条</div>}
                        {error && <div style={{ color: 'crimson', marginLeft: 12 }}>{error}</div>}
                    </div>
                </div>
            </div>

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
                        {message && <div className="message-box">{message}</div>}
                    </div>
                </div>
            )}
        </section>
    )
}

export default ContactsPage
