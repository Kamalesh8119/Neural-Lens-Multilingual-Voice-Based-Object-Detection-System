import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import { PageLoader } from '../components/common/UI'

function Shell({ isAdmin }) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  React.useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 920) setMobileNavOpen(false)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-nav-trigger"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span>Menu</span>
      </button>
      <div
        className={`mobile-nav-backdrop${mobileNavOpen ? ' open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <Sidebar
        isAdmin={isAdmin}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <main className="main-area"><Outlet /></main>
    </div>
  )
}

export function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Shell isAdmin={false} />
}

export function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Shell isAdmin={true} />
}

export function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return <Outlet />
}
