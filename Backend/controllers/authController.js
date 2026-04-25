const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const { User, RefreshToken, AuditLog } = require('../models')
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService')

const genOTP      = () => Math.floor(100000 + Math.random() * 900000).toString()
const genAccess   = (user) => jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' })
const genRefresh  = (user) => jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
const genPreAuth  = (userId) => jwt.sign({ userId, step: '2fa' }, process.env.JWT_SECRET, { expiresIn: '15m' })

function sendOTPEmailInBackground(user, otp) {
  sendOTPEmail(user.email, user.name, otp).catch((err) => {
    console.error(`Failed to send OTP email to ${user.email}:`, err.message)
  })
}

async function issueTokens(user, req, res) {
  user.lastLogin  = new Date()
  user.loginCount = (user.loginCount || 0) + 1
  await user.save()

  const accessToken  = genAccess(user)
  const refreshToken = genRefresh(user)

  await RefreshToken.create({ token: refreshToken, user: user._id, expiresAt: new Date(Date.now() + 7*24*60*60*1000) })
  await AuditLog.create({ user: user._id, action: 'LOGIN', ipAddress: req.ip, userAgent: req.headers['user-agent'], status: 'success' })

  res.json({
    accessToken, refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      settings: user.settings,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
    }
  })
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' })
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })
    await User.create({
      name,
      email,
      password,
      isEmailVerified: false,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
    })
    res.status(201).json({ message: 'Account created successfully. Please sign in.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body
    const user = await User.findOne({ email })

    // Role mismatch check
    if (user && role && user.role !== role) {
      return res.json({ roleMismatch: true })
    }

    if (!user || !(await user.matchPassword(password))) {
      await AuditLog.create({ action: 'LOGIN_FAILED', ipAddress: req.ip, status: 'failure', details: { email } })
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked. Contact support.' })

    // Admin — bypass OTP, issue tokens directly
    if (user.role === 'admin') {
      return issueTokens(user, req, res)
    }

    // Regular user — 2FA via email OTP
    const otp = genOTP()
    user.otpCode      = otp
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    sendOTPEmailInBackground(user, otp)

    const preAuthToken = genPreAuth(user._id)
    res.json({ requiresTwoFactor: true, preAuthToken, method: 'email' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.verifyOTP = async (req, res) => {
  try {
    const { preAuthToken, otp } = req.body
    const decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET)
    if (decoded.step !== '2fa') return res.status(401).json({ message: 'Invalid token' })

    const user = await User.findById(decoded.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (!user.otpCode || user.otpCode !== otp) return res.status(401).json({ message: 'Invalid verification code' })
    if (user.otpExpiresAt < new Date()) return res.status(401).json({ message: 'Code expired. Request a new one.' })

    user.isEmailVerified = true
    user.twoFactorEnabled = true
    user.twoFactorMethod = 'email'
    user.otpCode = undefined
    user.otpExpiresAt = undefined
    await issueTokens(user, req, res)
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid session token' })
    res.status(500).json({ message: err.message })
  }
}

exports.resendOTP = async (req, res) => {
  try {
    const { preAuthToken } = req.body
    const decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const otp = genOTP()
    user.otpCode      = otp
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    sendOTPEmailInBackground(user, otp)

    res.json({ message: 'New OTP is being sent to your email' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' })

    const stored = await RefreshToken.findOne({ token: refreshToken })
    if (!stored || stored.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token expired' })

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user || user.isBlocked) return res.status(401).json({ message: 'Invalid session' })

    const accessToken = genAccess(user)
    res.json({ accessToken })
  } catch (err) { res.status(401).json({ message: 'Invalid refresh token' }) }
}

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken })
    res.json({ message: 'Logged out successfully' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    // Always respond success to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })

    const token = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken   = crypto.createHash('sha256').update(token).digest('hex')
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()

    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, user.name, resetURL)

    res.json({ message: 'Password reset link sent to your email.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query
    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: new Date() } })
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' })
    res.json({ valid: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body
    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: new Date() } })
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' })
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' }

)

    user.password = newPassword
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save()

    await RefreshToken.deleteMany({ user: user._id })
    res.json({ message: 'Password reset successful. Please sign in.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
