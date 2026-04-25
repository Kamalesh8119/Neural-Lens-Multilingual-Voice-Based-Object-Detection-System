import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PrivateRoute, AdminRoute, PublicRoute } from './routes/Guards'
import { PageLoader } from './components/common/UI'

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const VerifyOTP = lazy(() => import('./pages/auth/VerifyOTP'))
const ForgotPassword = lazy(() =>
  import('./pages/auth/PasswordReset').then((module) => ({ default: module.ForgotPassword }))
)
const ResetPassword = lazy(() =>
  import('./pages/auth/PasswordReset').then((module) => ({ default: module.ResetPassword }))
)

const Dashboard = lazy(() => import('./pages/user/Dashboard'))
const ScanHistory = lazy(() =>
  import('./pages/user/UserPages').then((module) => ({ default: module.ScanHistory }))
)
const Profile = lazy(() =>
  import('./pages/user/UserPages').then((module) => ({ default: module.Profile }))
)
const Settings = lazy(() =>
  import('./pages/user/UserPages').then((module) => ({ default: module.Settings }))
)

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UserManagement = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.UserManagement }))
)
const ModelMetrics = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.ModelMetrics }))
)
const SecurityLogs = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.SecurityLogs }))
)

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public (redirect to app if logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* OTP verify (always public — needed during login) */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Protected user routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<ScanHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/metrics" element={<ModelMetrics />} />
          <Route path="/admin/security" element={<SecurityLogs />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background:'var(--bg4)', color:'var(--t1)', border:'1px solid var(--border)', fontSize:13 },
          success: { iconTheme: { primary:'var(--green)', secondary:'var(--bg4)' } },
          error: { iconTheme: { primary:'var(--red)', secondary:'var(--bg4)' } },
        }} />
      </ThemeProvider>
    </AuthProvider>
  )
}
