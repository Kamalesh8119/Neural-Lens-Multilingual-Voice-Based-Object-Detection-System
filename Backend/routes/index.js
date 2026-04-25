const express  = require('express')
const multer   = require('multer')
const {protect,adminOnly} = require('../middleware/auth')
const auth  = require('../controllers/authController')
const ctrl  = require('../controllers/controllers')
const detectionCtrl = require('../controllers/detectionController')
const ttsCtrl = require('../controllers/ttsController')
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024}})

const r = express.Router()

r.post('/auth/register',           auth.register)
r.post('/auth/login',              auth.login)
r.post('/auth/verify-otp',         auth.verifyOTP)
r.post('/auth/resend-otp',         auth.resendOTP)
r.post('/auth/refresh-token',      auth.refreshToken)
r.post('/auth/logout',             auth.logout)
r.post('/auth/forgot-password',    auth.forgotPassword)
r.get ('/auth/verify-reset-token', auth.verifyResetToken)
r.post('/auth/reset-password',     auth.resetPassword)
r.post('/detection/detect', protect, upload.single('image'), detectionCtrl.detectObjects)
r.get ('/detection/health',  detectionCtrl.getHealth)
r.post('/tts/speak', protect, ttsCtrl.speak)
r.get   ('/scans',     protect, ctrl.getUserScans)
r.get   ('/scans/:id', protect, ctrl.getScanById)
r.delete('/scans/:id', protect, ctrl.deleteScan)
r.get('/users/profile',         protect, ctrl.getProfile)
r.put('/users/profile',         protect, ctrl.updateProfile)
r.put('/users/settings',        protect, ctrl.updateSettings)
r.put('/users/change-password', protect, ctrl.changePassword)
r.get   ('/admin/users',                   protect,adminOnly, ctrl.getAllUsers)
r.put   ('/admin/users/:id/toggle-block',  protect,adminOnly, ctrl.toggleBlock)
r.delete('/admin/users/:id',               protect,adminOnly, ctrl.deleteUser)
r.get   ('/admin/model-stats',             protect,adminOnly, ctrl.getModelStats)
r.get   ('/admin/audit-logs',              protect,adminOnly, ctrl.getAuditLogs)

console.log({
  authRegister: auth.register,
  authLogin: auth.login,
  authVerifyOTP: auth.verifyOTP,
  authResendOTP: auth.resendOTP,
  authRefreshToken: auth.refreshToken,
  authLogout: auth.logout,
  authForgotPassword: auth.forgotPassword,
  authVerifyResetToken: auth.verifyResetToken,
  authResetPassword: auth.resetPassword,
  detectObjects: detectionCtrl.detectObjects,
  getHealth: detectionCtrl.getHealth,
  speakTts: ttsCtrl.speak,
  getUserScans: ctrl.getUserScans,
  getScanById: ctrl.getScanById,
  deleteScan: ctrl.deleteScan,
  getProfile: ctrl.getProfile,
  updateProfile: ctrl.updateProfile,
  updateSettings: ctrl.updateSettings,
  changePassword: ctrl.changePassword,
  getAllUsers: ctrl.getAllUsers,
  toggleBlock: ctrl.toggleBlock,
  deleteUser: ctrl.deleteUser,
  getModelStats: ctrl.getModelStats,
  getAuditLogs: ctrl.getAuditLogs,
})
module.exports = r
