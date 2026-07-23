import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ContactsPage from './pages/ContactsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">通讯录管理系统</div>
          <nav className="app-nav">
            <NavLink to="/auth" className={({ isActive }) => (isActive ? 'active' : '')}>
              登录 / 注册
            </NavLink>
            <NavLink to="/contacts" className={({ isActive }) => (isActive ? 'active' : '')}>
              通讯录
            </NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/" element={<Navigate replace to="/auth" />} />
            <Route path="*" element={<Navigate replace to="/auth" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
