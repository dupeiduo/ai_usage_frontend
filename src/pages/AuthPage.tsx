import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'

type AuthMode = 'login' | 'register' | 'forget'

type FormState = {
    name: string
    email: string
    password: string
    confirmPassword: string
}

type AuthPageProps = {
    onAuthSuccess: (token: string) => void
}

const initialState: FormState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
    const navigate = useNavigate()
    const [mode, setMode] = useState<AuthMode>('login')
    const [form, setForm] = useState<FormState>(initialState)
    const [message, setMessage] = useState<string>('')
    const [loading, setLoading] = useState(false)

    // Backend endpoints used for authentication and password reset.
    const endpoint = {
        login: '/api/user/login',
        register: '/api/user/register',
        forget: '/api/user/forget',
    }

    const handleChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        setMessage('')
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setMessage('')

        if (mode === 'register' && form.password !== form.confirmPassword) {
            setMessage('两次密码不一致，请重新输入。')
            return
        }

        const payload =
            mode === 'login'
                ? { email: form.email, password: form.password }
                : mode === 'register'
                    ? {
                        name: form.name,
                        email: form.email,
                        password: form.password,
                        password_confirm: form.confirmPassword,
                    }
                    : { email: form.email }

        setLoading(true)
        try {
            const response = await fetch(endpoint[mode], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const result = await response.json()

            if (!response.ok) {
                // Display backend error message when available.
                throw new Error(result.message || '请求失败，请重试。')
            }

            if (mode === 'login') {
                const token = result.access_token
                if (!token) {
                    throw new Error('登录时未收到有效的 token')
                }
                onAuthSuccess(token)
                setMessage('登录成功，正在跳转到通讯录。')
                navigate('/contacts')
                return
            }

            if (mode === 'register') {
                const token = result.access_token
                if (!token) {
                    throw new Error('注册时未收到有效的 token')
                }
                onAuthSuccess(token)
                setMessage('注册成功，正在跳转到通讯录。')
                setForm(initialState)
                navigate('/contacts')
                return
            }

            setMessage(result.message || '操作成功。')
        } catch (error) {
            if (error instanceof Error) {
                setMessage(error.message)
            } else {
                setMessage('发生未知错误，请稍后再试。')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="page-card auth-page">
            <div className="page-header">
                <h1 className="page-title">用户登录 / 注册</h1>
                <div className="mode-switch">
                    <button
                        type="button"
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => {
                            setMode('login')
                            setMessage('')
                        }}
                    >
                        登录
                    </button>
                    <button
                        type="button"
                        className={mode === 'register' ? 'active' : ''}
                        onClick={() => {
                            setMode('register')
                            setMessage('')
                        }}
                    >
                        注册
                    </button>
                    <button
                        type="button"
                        className={mode === 'forget' ? 'active' : ''}
                        onClick={() => {
                            setMode('forget')
                            setMessage('')
                        }}
                    >
                        忘记密码
                    </button>
                </div>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                {mode === 'register' && (
                    <label>
                        姓名
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="请输入姓名"
                            required
                        />
                    </label>
                )}

                <label>
                    邮箱
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="请输入邮箱"
                        required
                    />
                </label>

                {mode !== 'forget' && (
                    <label>
                        密码
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="请输入密码"
                            required
                        />
                    </label>
                )}

                {mode === 'register' && (
                    <label>
                        确认密码
                        <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            placeholder="请再次输入密码"
                            required
                        />
                    </label>
                )}

                <button className="primary-button" type="submit" disabled={loading}>
                    {loading
                        ? '处理中...'
                        : mode === 'login'
                            ? '登录'
                            : mode === 'register'
                                ? '注册'
                                : '发送重置邮件'}
                </button>
            </form>

            {message && <div className="message-box">{message}</div>}
        </section>
    )
}

export default AuthPage
