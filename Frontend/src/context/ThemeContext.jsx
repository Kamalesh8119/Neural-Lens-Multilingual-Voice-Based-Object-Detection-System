import React, { createContext, useContext, useState, useEffect } from 'react'
const Ctx = createContext(null)
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme) }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return <Ctx.Provider value={{ theme, toggleTheme }}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
