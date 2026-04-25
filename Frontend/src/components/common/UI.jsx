import React, { useState } from 'react'

/* ── BUTTON ── */
export function Btn({ children, variant='primary', size='md', disabled, loading, full, onClick, type='button', style={} }) {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
    fontFamily:'var(--body)', fontWeight:500, borderRadius:'var(--r2)',
    cursor: disabled||loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition:'all var(--ease)', whiteSpace:'nowrap', border:'none',
    width: full ? '100%' : 'auto',
    padding: size==='sm' ? '7px 14px' : size==='lg' ? '13px 28px' : '10px 20px',
    fontSize: size==='sm' ? '12px' : size==='lg' ? '15px' : '13px',
  }
  const v = {
    primary:   { background:'var(--accent)',    color:'#fff' },
    secondary: { background:'var(--bg5)',       color:'var(--t1)', border:'1px solid var(--border)' },
    danger:    { background:'var(--red-bg)',    color:'var(--red)',    border:'1px solid var(--red)40' },
    success:   { background:'var(--green-bg)',  color:'var(--green)',  border:'1px solid var(--green)40' },
    ghost:     { background:'transparent',      color:'var(--t2)',     border:'none' },
    warning:   { background:'var(--yellow-bg)', color:'var(--yellow)', border:'1px solid var(--yellow)40' },
  }
  const [hov, setHov] = useState(false)
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...v[variant]||v.primary,
        filter: hov && !disabled && !loading ? 'brightness(1.12)' : 'none',
        transform: hov && !disabled && !loading ? 'translateY(-1px)' : 'none',
        boxShadow: hov && variant==='primary' ? '0 4px 16px var(--accent-glow)' : 'none',
        ...style }}>
      {loading && <span style={{ width:13, height:13, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />}
      {children}
    </button>
  )
}

/* ── INPUT ── */
export function Input({ label, error, hint, icon, type='text', placeholder, value, onChange, required, disabled, ...rest }) {
  const [focused, setFocused] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const inputType = type==='password' ? (showPw ? 'text' : 'password') : type
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'var(--t2)', letterSpacing:'0.02em' }}>
        {label}{required && <span style={{ color:'var(--red)', marginLeft:3 }}>*</span>}
      </label>}
      <div style={{ position:'relative' }}>
        {icon && <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: focused ? 'var(--accent)' : 'var(--t3)', display:'flex', pointerEvents:'none', transition:'color var(--ease)' }}>{icon}</span>}
        <input type={inputType} placeholder={placeholder} value={value} onChange={onChange}
          required={required} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:'100%', padding: icon ? '11px 12px 11px 40px' : '11px 14px',
            paddingRight: type==='password' ? '42px' : '14px',
            background:'var(--bg5)', border:`1px solid ${error ? 'var(--red)' : focused ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius:'var(--r2)', color:'var(--t1)', fontSize:13, outline:'none',
            transition:'border-color var(--ease), box-shadow var(--ease)',
            boxShadow: focused && !error ? '0 0 0 3px var(--accent-bg)' : 'none',
            opacity: disabled ? 0.5 : 1 }} {...rest} />
        {type==='password' && (
          <button type="button" onClick={() => setShowPw(s=>!s)}
            style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--t3)', cursor:'pointer', display:'flex', padding:0 }}>
            {showPw
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize:11, color:'var(--red)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize:11, color:'var(--t3)' }}>{hint}</span>}
    </div>
  )
}

/* ── SPINNER ── */
export function Spinner({ size=24, color='var(--accent)' }) {
  return <div style={{ width:size, height:size, border:`2px solid ${color}30`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
}

export function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', flexDirection:'column', gap:16 }}>
      <Spinner size={40} />
      <span style={{ color:'var(--t3)', fontSize:13, fontFamily:'var(--display)' }}>Loading Neural Lens...</span>
    </div>
  )
}

/* ── MODAL ── */
export function Modal({ isOpen, onClose, title, children, width=480 }) {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow='hidden'
    else document.body.style.overflow=''
    return () => { document.body.style.overflow='' }
  }, [isOpen])
  if (!isOpen) return null
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'fadeUp 0.2s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r4)', width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.6)', animation:'scaleIn 0.25s ease both' }}>
        {title && (
          <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:700 }}>{title}</h3>
            <button onClick={onClose} style={{ background:'var(--bg5)', border:'none', color:'var(--t2)', cursor:'pointer', width:30, height:30, borderRadius:'var(--r1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  )
}

/* ── STAT CARD ── */
export function StatCard({ label, value, sub, icon, color='var(--accent)', trend }) {
  return (
    <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{label}</p>
        <p style={{ fontFamily:'var(--display)', fontSize:30, fontWeight:800, color:'var(--t1)', lineHeight:1, marginBottom:6 }}>{value}</p>
        {sub && <p style={{ fontSize:12, color:'var(--t3)' }}>{sub}</p>}
        {trend !== undefined && <p style={{ fontSize:12, color: trend>=0 ? 'var(--green)' : 'var(--red)', fontWeight:600, marginTop:4 }}>{trend>=0?'+':''}{trend}% this week</p>}
      </div>
      <div style={{ width:46, height:46, background:`${color}18`, borderRadius:'var(--r2)', display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
    </div>
  )
}
