import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import ContactsPage from './pages/ContactsPage'
import './App.css'

function App() {
  // Track authentication token from localStorage.
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    // On app load, check if a valid auth token exists.
    const token = localStorage.getItem('authToken')
    setLoggedIn(!!token)
  }, [])

  const handleAuthSuccess = (token: string) => {
    // Persist JWT token and update UI.
    localStorage.setItem('authToken', token)
    setLoggedIn(true)
  }

  const handleLogout = () => {
    // Clear token and reset auth state.
    localStorage.removeItem('authToken')
    setLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">通讯录管理系统</div>
          <nav className="app-nav">
            {!loggedIn ? (
              <NavLink to="/auth" className={({ isActive }) => (isActive ? 'active' : '')}>
                登录 / 注册
              </NavLink>
            ) : (
              <>
                <NavLink to="/contacts" className={({ isActive }) => (isActive ? 'active' : '')}>
                  通讯录
                </NavLink>
                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                >
                  登出
                </button>
              </>
            )}
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route
              path="/auth"
              element={loggedIn ? <Navigate replace to="/contacts" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
            />
            <Route
              path="/contacts"
              element={loggedIn ? <ContactsPage /> : <Navigate replace to="/auth" />}
            />
            <Route path="/" element={<Navigate replace to="/auth" />} />
            <Route path="*" element={<Navigate replace to="/auth" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
