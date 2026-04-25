const jwt = require('jsonwebtoken')
const { User } = require('../models')
exports.protect = async (req,res,next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({message:'No token'})
  try {
    const d = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    req.user = await User.findById(d.userId).select('-password -otpCode -passwordResetToken')
    if (!req.user) return res.status(401).json({message:'User not found'})
    if (req.user.isBlocked) return res.status(403).json({message:'Account blocked'})
    next()
  } catch { res.status(401).json({message:'Invalid token'}) }
}
exports.adminOnly = (req,res,next) => req.user?.role==='admin' ? next() : res.status(403).json({message:'Admin only'})
