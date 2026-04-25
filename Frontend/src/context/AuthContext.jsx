import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/axiosInstance'
const Ctx = createContext(null)

function clearStoredAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    try { const u=localStorage.getItem('user'); if(u) setUser(JSON.parse(u)) } catch { clearStoredAuth() }
    setLoading(false)
  }, [])
  const login = async (email, password, role) => {
    const { data } = await api.post('/auth/login', { email, password, role })
    // Admin bypasses OTP — tokens arrive directly
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
    } else {
      clearStoredAuth()
      setUser(null)
    }
    return data
  }
  const verifyOTP = async (preAuthToken, otp) => {
    const { data } = await api.post('/auth/verify-otp', { preAuthToken, otp })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }
  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }) } catch {}
    clearStoredAuth(); setUser(null)
  }
  const updateUser = updated => {
    const m = { ...user, ...updated }
    localStorage.setItem('user', JSON.stringify(m)); setUser(m)
  }
  return <Ctx.Provider value={{ user, loading, login, verifyOTP, logout, updateUser }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
