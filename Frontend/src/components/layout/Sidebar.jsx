import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Logo = () => (
  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
    <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px var(--accent-glow)', flexShrink:0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
        <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
        <line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/>
        <line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/>
      </svg>
    </div>
    <span style={{ fontFamily:'var(--display)', fontWeight:800, fontSize:18, letterSpacing:'-0.02em' }}>
      Neural<span style={{ color:'var(--accent)' }}>Lens</span>
    </span>
  </div>
)

function NavItem({ to, icon, label, end=false, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
        borderRadius:'var(--r2)', fontSize:13, fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--accent)' : 'var(--t2)',
        background: isActive ? 'var(--accent-bg)' : 'transparent',
        border: isActive ? '1px solid var(--accent)20' : '1px solid transparent',
        textDecoration:'none', transition:'all var(--ease)',
      })}
    >
      {icon}{label}
    </NavLink>
  )
}

const icons = {
  detect: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  overview: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  metrics: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  security: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  sun: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  moon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
}

export default function Sidebar({ isAdmin=false, mobileOpen=false, onCloseMobile }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const userNav = [
    { to:'/dashboard', label:'Detection', icon:icons.detect, end:true },
    { to:'/history', label:'Scan History', icon:icons.history },
    { to:'/profile', label:'Profile', icon:icons.profile },
    { to:'/settings', label:'Settings', icon:icons.settings },
  ]
  const adminNav = [
    { to:'/admin', label:'Overview', icon:icons.overview, end:true },
    { to:'/admin/users', label:'Users', icon:icons.users },
    { to:'/admin/metrics', label:'Model Metrics', icon:icons.metrics },
    { to:'/admin/security', label:'Security Logs', icon:icons.security },
  ]
  const nav = isAdmin ? adminNav : userNav
  const closeMobile = () => onCloseMobile?.()

  const handleLogout = async () => { await logout(); closeMobile(); navigate('/login') }

  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <Logo />
        <button
          type="button"
          className="mobile-sidebar-close"
          onClick={closeMobile}
          aria-label="Close navigation menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:3 }}>
        {isAdmin && <p style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em', padding:'4px 14px 6px' }}>Admin Panel</p>}
        {nav.map(n => <NavItem key={n.to} {...n} onNavigate={closeMobile} />)}

        {!isAdmin && user?.role === 'admin' && (
          <>
            <div style={{ height:1, background:'var(--border)', margin:'8px 10px' }} />
            <NavItem to="/admin" label="Admin Panel" icon={icons.overview} onNavigate={closeMobile} />
          </>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding:'14px 10px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{ width:'100%', padding:'9px 14px', display:'flex', alignItems:'center', gap:9, background:'none', border:'1px solid var(--border)', borderRadius:'var(--r2)', color:'var(--t2)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all var(--ease)' }}
          onMouseEnter={e => e.currentTarget.style.background='var(--bg5)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}>
          {theme==='dark' ? icons.sun : icons.moon}
          {theme==='dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* User chip */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg5)', border:'1px solid var(--border)', borderRadius:'var(--r2)' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.role === 'admin' ? 'Administrator' : user?.name}
            </p>
            <p style={{ fontSize:10, color:'var(--t3)', textTransform:'capitalize' }}>
              {user?.role === 'admin' ? '' : user?.role}
            </p>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:2, display:'flex' }}>
            {icons.logout}
          </button>
        </div>
      </div>
    </aside>
  )
}
