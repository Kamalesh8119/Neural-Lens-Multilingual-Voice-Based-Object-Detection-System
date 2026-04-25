const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// ── USER ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true, minlength: 8 },
  role:             { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked:        { type: Boolean, default: false },
  isEmailVerified:  { type: Boolean, default: false },
  phone:            { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: true },
  twoFactorMethod:  { type: String, enum: ['email'], default: 'email' },

  // 2FA (mandatory for all users via email OTP)
  otpCode:          { type: String },
  otpExpiresAt:     { type: Date },

  // Password reset
  passwordResetToken:   { type: String },
  passwordResetExpires: { type: Date },

  settings: {
    notifications: { type: Boolean, default: true },
    emailAlerts:   { type: Boolean, default: true },
  },

  lastLogin:  { type: Date },
  loginCount: { type: Number, default: 0 },
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})
userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password)
}

// ── SCAN ──────────────────────────────────────────────────────────────────────
const detectedObjectSchema = new mongoose.Schema({
  label:      { type: String, required: true },
  confidence: { type: Number, required: true },
  bbox: { x: Number, y: Number, width: Number, height: Number },
}, { _id: false })

const scanSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl:        { type: String, required: true },
  sourceType:      { type: String, enum: ['upload', 'camera'], required: true },
  detectedObjects: [detectedObjectSchema],
  objectCount:     { type: Number, default: 0 },
  processingTime:  { type: Number },
  modelVersion:    { type: String, default: 'yolov11' },
  status:          { type: String, enum: ['success', 'failed'], default: 'success' },
}, { timestamps: true })

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
const refreshTokenSchema = new mongoose.Schema({
  token:    { type: String, required: true, unique: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt:{ type: Date, required: true },
}, { timestamps: true })
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// ── AUDIT LOG ─────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:    { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  status:    { type: String, enum: ['success', 'failure'], default: 'success' },
  details:   { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })
auditLogSchema.index({ createdAt: -1 })

module.exports = {
  User:         mongoose.model('User', userSchema),
  Scan:         mongoose.model('Scan', scanSchema),
  RefreshToken: mongoose.model('RefreshToken', refreshTokenSchema),
  AuditLog:     mongoose.model('AuditLog', auditLogSchema),
}
