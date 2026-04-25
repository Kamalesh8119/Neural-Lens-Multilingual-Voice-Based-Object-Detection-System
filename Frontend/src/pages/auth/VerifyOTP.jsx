import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Btn } from '../../components/common/UI'
import api from '../../utils/axiosInstance'
import toast from 'react-hot-toast'

export default function VerifyOTP() {
  const { verifyOTP } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)

  const preAuthToken =
    location.state?.preAuthToken || sessionStorage.getItem('preAuthToken') || localStorage.getItem('preAuthToken')
  const email =
    location.state?.email || query.get('email') || sessionStorage.getItem('otpEmail') || localStorage.getItem('otpEmail')
  const role =
    location.state?.role || query.get('role') || sessionStorage.getItem('otpRole') || localStorage.getItem('otpRole')

  const [otp, setOtp] = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const refs = useRef([])
  const hasOtpSession = Boolean(preAuthToken)

  useEffect(() => {
    if (hasOtpSession) refs.current[0]?.focus()
  }, [hasOtpSession])

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((x) => (x > 0 ? x - 1 : 0))
    }, 1000)

    return () => clearInterval(t)
  }, [])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return

    const next = [...otp]
    next[i] = val
    setOtp(next)

    if (val && i < 5) refs.current[i + 1]?.focus()

    if (val && i === 5) {
      const full = next.join('')
      if (full.length === 6) submit(full)
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      refs.current[5]?.focus()
      submit(pasted)
    }
  }

  const clearOtpSession = () => {
    sessionStorage.removeItem('preAuthToken')
    sessionStorage.removeItem('otpEmail')
    sessionStorage.removeItem('otpRole')
    localStorage.removeItem('preAuthToken')
    localStorage.removeItem('otpEmail')
    localStorage.removeItem('otpRole')
  }

  const submit = async (code) => {
    if (!preAuthToken) {
      toast.error('OTP session expired. Please sign in again.')
      return
    }

    setLoading(true)

    try {
      const data = await verifyOTP(preAuthToken, code)

      clearOtpSession()
      toast.success('Verified! Welcome.')

      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
      setOtp(Array(6).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!preAuthToken) {
      toast.error('OTP session expired. Please sign in again.')
      return
    }

    setResending(true)

    try {
      await api.post('/auth/resend-otp', { preAuthToken })
      setTimeLeft(600)
      setOtp(Array(6).fill(''))
      refs.current[0]?.focus()
      toast.success('New OTP sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const masked = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : ''

  return (
    <div className="auth-shell">
      <div className="auth-card anim-scale" style={{ maxWidth: 420, textAlign: 'center' }}>
        <button
          onClick={() => {
            clearOtpSession()
            navigate('/login')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--t2)',
            cursor: 'pointer',
            fontSize: 12,
            marginBottom: 24,
            padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to login
        </button>

        <div
          style={{
            width: 64,
            height: 64,
            background: 'var(--accent-bg)',
            border: '2px solid var(--accent)30',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 32px var(--accent-glow)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Check your email
        </h2>

        <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>
          We sent a 6-digit code to
        </p>

        <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {masked}
        </p>

        <span className="badge badge-blue" style={{ marginBottom: 28 }}>
          {role === 'admin' ? 'Administrator' : 'User'} login
        </span>

        {!hasOtpSession && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 14px',
              background: 'var(--yellow-bg)',
              border: '1px solid var(--yellow)40',
              borderRadius: 'var(--r2)',
              color: 'var(--yellow)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Your verification session is missing or expired. Go back to login and sign in again to
            request a fresh OTP.
          </div>
        )}

        <div
          className="mobile-otp-grid"
          style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 26 }}
          onPaste={handlePaste}
        >
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={!hasOtpSession}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 52,
                height: 60,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 700,
                fontFamily: 'var(--display)',
                background: 'var(--bg5)',
                border: `2px solid ${d ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r2)',
                color: 'var(--t1)',
                outline: 'none',
                transition: 'border-color var(--ease)',
                caretColor: 'var(--accent)',
              }}
            />
          ))}
        </div>

        <Btn
          full
          loading={loading}
          size="lg"
          disabled={!hasOtpSession}
          onClick={() => {
            const code = otp.join('')
            if (code.length === 6) submit(code)
            else toast.error('Enter all 6 digits')
          }}
        >
          Verify & Sign In
        </Btn>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>

          {timeLeft > 0 ? (
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>
              Code expires in <strong style={{ color: 'var(--t2)' }}>{mins}:{secs}</strong>
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--red)' }}>Code expired</span>
          )}
        </div>

        <button
          onClick={resend}
          disabled={!hasOtpSession || resending || timeLeft > 540}
          style={{
            marginTop: 10,
            background: 'none',
            border: 'none',
            color: timeLeft > 540 ? 'var(--t3)' : 'var(--accent)',
            fontSize: 12,
            fontWeight: 500,
            cursor: timeLeft > 540 ? 'not-allowed' : 'pointer',
            opacity: timeLeft > 540 ? 0.5 : 1,
          }}
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
