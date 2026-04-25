import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Btn, Input } from '../../components/common/UI'
import api from '../../utils/axiosInstance'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password required'
    else if (form.password.length < 8) e.password = 'Minimum 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e); return !Object.keys(e).length
  }

  const handle = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/register', { name:form.name, email:form.email, password:form.password })
      toast.success('Account created! Sign in now.')
      navigate('/login')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:''})) }

  return (
    <div className="auth-shell">
      <div className="auth-card anim-scale" style={{ maxWidth:500 }}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:50,height:50,background:'var(--accent)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:'0 0 24px var(--accent-glow)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>
          </div>
          <h2 style={{fontFamily:'var(--display)',fontSize:24,fontWeight:800,letterSpacing:'-0.02em',marginBottom:4}}>Create account</h2>
          <p style={{color:'var(--t2)',fontSize:13}}>Join Neural Lens today</p>
        </div>
        <form onSubmit={handle} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="g2">
            <Input label="Full name" placeholder="Enter your name" value={form.name} onChange={set('name')} error={errors.name} required/>
            <Input label="Email" type="email" placeholder="Enter your mail address" value={form.email} onChange={set('email')} error={errors.email} required/>
          </div>
          <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} error={errors.password} required/>
          <Input label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required/>
          <div style={{padding:'10px 14px',background:'var(--green-bg)',border:'1px solid var(--green)30',borderRadius:'var(--r2)',display:'flex',gap:8,alignItems:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{fontSize:12,color:'var(--green)'}}>Two-factor authentication enabled by default</span>
          </div>
          <Btn type="submit" full loading={loading} size="lg">Create Account</Btn>
        </form>
        <p style={{marginTop:18,textAlign:'center',fontSize:13,color:'var(--t2)'}}>
          Already have an account? <Link to="/login" style={{color:'var(--accent)',fontWeight:600}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
