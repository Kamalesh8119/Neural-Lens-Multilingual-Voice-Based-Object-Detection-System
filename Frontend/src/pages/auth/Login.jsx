import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Btn, Input } from '../../components/common/UI'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const pendingOtpToken = sessionStorage.getItem('preAuthToken') || localStorage.getItem('preAuthToken')

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  if (!user && pendingOtpToken) {
    return <Navigate to="/verify-otp" replace />
  }

  const handle = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const data = await login(form.email, form.password)

      if (data.accessToken) {
        toast.success('Welcome back!')
        navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        sessionStorage.setItem('preAuthToken', data.preAuthToken)
        sessionStorage.setItem('otpEmail', form.email)
        sessionStorage.setItem('otpRole', 'user')
        localStorage.setItem('preAuthToken', data.preAuthToken)
        localStorage.setItem('otpEmail', form.email)
        localStorage.setItem('otpRole', 'user')
        navigate('/verify-otp', {
          replace: true,
          state: {
            preAuthToken: data.preAuthToken,
            email: form.email,
            role: 'user',
          },
        })
        return
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '48px 24px',
      }}
      className="login-root"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'linear-gradient(180deg, rgba(20,28,56,0.92), rgba(11,16,34,0.96))',
          border: '1px solid var(--border)',
          borderRadius: 28,
          padding: '40px 40px 32px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        }}
        className="anim-fade"
      >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: 'var(--accent)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>

            <h2
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--body)',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--t2)',
                }}
              >
                Welcome to
              </span>
              <span
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: 31,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                Neural <span style={{ color: 'var(--accent)' }}>Lens</span>
              </span>
            </h2>
            <p style={{ color: 'var(--t2)', fontSize: 13 }}>Sign in to your Neural Lens account</p>
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              value={form.email}
              onChange={(e) => {
                setForm((current) => ({ ...current, email: e.target.value }))
                setErrors((current) => ({ ...current, email: '' }))
              }}
              error={errors.email}
              required
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => {
                  setForm((current) => ({ ...current, password: e.target.value }))
                  setErrors((current) => ({ ...current, password: '' }))
                }}
                error={errors.password}
                required
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                }
              />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <Btn type="submit" full loading={loading} size="lg" style={{ marginTop: 4 }}>
              Sign In
            </Btn>
          </form>
          <p style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
      </div>
    </div>
  )
}
