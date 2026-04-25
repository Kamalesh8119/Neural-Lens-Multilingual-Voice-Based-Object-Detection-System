import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Btn, Input } from '../../components/common/UI'
import api from '../../utils/axiosInstance'
import toast from 'react-hot-toast'

/* ── FORGOT PASSWORD ── */
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    if (!email) return setError('Email is required')
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Enter a valid email')
    setError(''); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send reset email') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card anim-scale" style={{ maxWidth:440 }}>
        <button onClick={() => window.history.back()} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:12, marginBottom:24, padding:0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to login
        </button>

        {sent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:64, height:64, background:'var(--green-bg)', border:'2px solid var(--green)30', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, marginBottom:8, color:'var(--green)' }}>Email Sent!</h2>
            <p style={{ color:'var(--t2)', fontSize:13, lineHeight:1.7, marginBottom:20 }}>
              We sent a password reset link to <strong style={{ color:'var(--t1)' }}>{email}</strong>. Check your inbox — it expires in 1 hour.
            </p>
            <p style={{ fontSize:12, color:'var(--t3)', marginBottom:20 }}>Didn't receive it? Check spam or try again.</p>
            <Btn variant="secondary" full onClick={() => setSent(false)}>Try a different email</Btn>
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ width:52, height:52, background:'var(--accent)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 0 24px var(--accent-glow)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h2 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.02em', marginBottom:6 }}>Forgot Password</h2>
              <p style={{ color:'var(--t2)', fontSize:13 }}>Enter your email and we'll send a reset link</p>
            </div>
            <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Input label="Email address" type="email" placeholder="Enter your email address" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }} error={error} required
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />
              <Btn type="submit" full loading={loading} size="lg">Send Reset Link</Btn>
            </form>
          </>
        )}
        <p style={{ marginTop:18, textAlign:'center', fontSize:13, color:'var(--t2)' }}>
          Remember it? <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

/* ── RESET PASSWORD ── */
export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [tokenValid, setTokenValid] = useState(null)
  const [form, setForm] = useState({ password:'', confirm:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setTokenValid(false); return }
    api.get(`/auth/verify-reset-token?token=${token}`).then(()=>setTokenValid(true)).catch(()=>setTokenValid(false))
  }, [token])

  const reqs = [
    { text:'At least 8 characters', met: form.password.length>=8 },
    { text:'Contains a number', met: /\d/.test(form.password) },
    { text:'Passwords match', met: form.password===form.confirm && form.confirm.length>0 },
  ]

  const handle = async (e) => {
    e.preventDefault()
    const er = {}
    if (form.password.length < 8) er.password = 'Min 8 characters'
    if (form.password !== form.confirm) er.confirm = 'Passwords do not match'
    if (Object.keys(er).length) { setErrors(er); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed — link may have expired') }
    finally { setLoading(false) }
  }

  if (tokenValid===null) return (
    <div className="auth-shell">
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40,height:40,border:'3px solid var(--accent-bg)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 14px' }}/>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Verifying reset link...</p>
      </div>
    </div>
  )

  if (tokenValid===false) return (
    <div className="auth-shell">
      <div className="auth-card anim-scale" style={{ maxWidth:400, textAlign:'center' }}>
        <div style={{ width:60,height:60,background:'var(--red-bg)',border:'2px solid var(--red)30',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, marginBottom:10, color:'var(--red)' }}>Link Expired</h2>
        <p style={{ color:'var(--t2)', fontSize:13, marginBottom:20 }}>This reset link is invalid or has expired. Links are valid for 1 hour.</p>
        <Link to="/forgot-password"><Btn full>Request New Link</Btn></Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="auth-shell">
      <div className="auth-card anim-scale" style={{ maxWidth:400, textAlign:'center' }}>
        <div style={{ width:60,height:60,background:'var(--green-bg)',border:'2px solid var(--green)30',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, marginBottom:8 }}>Password Reset!</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Redirecting to login in 3 seconds...</p>
      </div>
    </div>
  )

  return (
    <div className="auth-shell">
      <div className="auth-card anim-scale" style={{ maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52,height:52,background:'var(--accent)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:'0 0 24px var(--accent-glow)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h2 style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, letterSpacing:'-0.02em', marginBottom:6 }}>Set New Password</h2>
          <p style={{ color:'var(--t2)', fontSize:13 }}>Choose a strong password for your account</p>
        </div>

        {/* Requirements */}
        <div style={{ padding:'12px 14px', background:'var(--bg5)', border:'1px solid var(--border)', borderRadius:'var(--r2)', marginBottom:18 }}>
          {reqs.map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:i<reqs.length-1?5:0 }}>
              <div style={{ width:16,height:16,borderRadius:'50%',background:r.met?'var(--green)':'var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background var(--ease)' }}>
                {r.met && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ fontSize:12, color:r.met?'var(--green)':'var(--t3)', transition:'color var(--ease)' }}>{r.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="New password" type="password" placeholder="Min. 8 characters" value={form.password}
            onChange={e=>{setForm(f=>({...f,password:e.target.value}));setErrors(er=>({...er,password:''}))}}
            error={errors.password} required
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>} />
          <Input label="Confirm password" type="password" placeholder="Repeat new password" value={form.confirm}
            onChange={e=>{setForm(f=>({...f,confirm:e.target.value}));setErrors(er=>({...er,confirm:''}))}}
            error={errors.confirm} required
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
          <Btn type="submit" full loading={loading} size="lg">Reset Password</Btn>
        </form>
      </div>
    </div>
  )
}
