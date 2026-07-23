import { useState } from 'react'
import type { FormEvent } from 'react'

type AuthMode = 'login' | 'register' | 'forget'

type FormState = {
    name: string
    email: string
    password: string
    confirmPassword: string
}

const initialState: FormState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
}

const AuthPage = () => {
    const [mode, setMode] = useState<AuthMode>('login')
    const [form, setForm] = useState<FormState>(initialState)
    const [message, setMessage] = useState<string>('')
    const [loading, setLoading] = useState(false)

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
                    ? { name: form.name, email: form.email, password: form.password }
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
                throw new Error(result.message || '请求失败，请重试。')
            }

            setMessage(result.message || '操作成功。')
            if (mode === 'login') {
                setMessage('登录成功，请前往通讯录页面查看数据。')
            }
            if (mode === 'register') {
                setForm(initialState)
            }
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

            <div className="auth-help">
                <p>使用下面接口测试:</p>
                <ul>
                    <li>/api/user/login</li>
                    <li>/api/user/register</li>
                    <li>/api/user/forget</li>
                </ul>
            </div>

            {message && <div className="message-box">{message}</div>}
        </section>
    )
}

export default AuthPage
