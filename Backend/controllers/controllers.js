// const { Scan, User, AuditLog } = require('../models')

// // ── SCAN CONTROLLER ───────────────────────────────────────────────────────────
// exports.getUserScans = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1
//     const limit = parseInt(req.query.limit) || 10
//     const skip  = (page - 1) * limit
//     const [scans, total] = await Promise.all([
//       Scan.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
//       Scan.countDocuments({ user: req.user._id }),
//     ])
//     res.json({ scans, total, page, pages: Math.ceil(total / limit) })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.getScanById = async (req, res) => {
//   try {
//     const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id })
//     if (!scan) return res.status(404).json({ message: 'Scan not found' })
//     res.json(scan)
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.deleteScan = async (req, res) => {
//   try {
//     const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id })
//     if (!scan) return res.status(404).json({ message: 'Scan not found' })
//     await scan.deleteOne()
//     res.json({ message: 'Scan deleted' })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// // ── USER CONTROLLER ───────────────────────────────────────────────────────────
// exports.getProfile = async (req, res) => {
//   res.json(req.user)
// }

// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, phone } = req.body
//     const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, select: '-password -otpCode -passwordResetToken' })
//     res.json({ user })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.updateSettings = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.user._id, { settings: req.body }, { new: true, select: '-password -otpCode' })
//     res.json({ user })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body
//     const user = await User.findById(req.user._id)
//     if (!(await user.matchPassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect' })
//     if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' })
//     user.password = newPassword
//     await user.save()
//     res.json({ message: 'Password updated successfully' })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// // ── ADMIN CONTROLLER ──────────────────────────────────────────────────────────
// exports.getAllUsers = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1
//     const limit = parseInt(req.query.limit) || 20
//     const [users, total] = await Promise.all([
//       User.find().select('-password -otpCode -passwordResetToken').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
//       User.countDocuments(),
//     ])
//     res.json({ users, total, pages: Math.ceil(total/limit) })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.toggleBlock = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//     if (!user) return res.status(404).json({ message: 'User not found' })
//     if (user.role === 'admin') return res.status(400).json({ message: 'Cannot block admin accounts' })
//     user.isBlocked = !user.isBlocked
//     await user.save()
//     res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.deleteUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//     if (!user) return res.status(404).json({ message: 'User not found' })
//     if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin accounts' })
//     await Promise.all([user.deleteOne(), Scan.deleteMany({ user: req.params.id }), AuditLog.deleteMany({ user: req.params.id })])
//     res.json({ message: 'User and all associated data deleted' })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.getModelStats = async (req, res) => {
//   try {
//     const [totalScans, avgTime, topLabels] = await Promise.all([
//       Scan.countDocuments({ status: 'success' }),
//       Scan.aggregate([{ $group: { _id: null, avg: { $avg: '$processingTime' } } }]),
//       Scan.aggregate([
//         { $unwind: '$detectedObjects' },
//         { $group: { _id: '$detectedObjects.label', count: { $sum: 1 }, avgConf: { $avg: '$detectedObjects.confidence' } } },
//         { $sort: { count: -1 } }, { $limit: 10 },
//       ]),
//     ])
//     res.json({ totalScans, averageProcessingTime: avgTime[0]?.avg?.toFixed(2) || 0, topDetectedObjects: topLabels })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }

// exports.getAuditLogs = async (req, res) => {
//   try {
//     const logs = await AuditLog.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200)
//     res.json({ logs })
//   } catch (err) { res.status(500).json({ message: err.message }) }
// }


const axios = require('axios')
const FormData = require('form-data')
const { Scan, User, AuditLog, RefreshToken } = require('../models')
const { deleteStoredImage } = require('../utils/imageStorage')

// ── SCAN CONTROLLER ───────────────────────────────────────────────────────────
exports.getUserScans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const [scans, total] = await Promise.all([
      Scan.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Scan.countDocuments({ user: req.user._id }),
    ])

    res.json({
      scans,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getScanById = async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' })
    }

    res.json(scan)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteScan = async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' })
    }

    await deleteStoredImage(scan.imageUrl)
    await scan.deleteOne()
    res.json({ message: 'Scan deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── ML DETECTION CONTROLLER ───────────────────────────────────────────────────
exports.detectObjects = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' })
    }

    const mlApiUrl = process.env.ML_API_URL
    if (!mlApiUrl) {
      return res.status(500).json({ message: 'ML_API_URL is not configured' })
    }

    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    })

    const { data } = await axios.post(`${mlApiUrl}/predict`, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 30000,
    })

    const detectedObjects = Array.isArray(data.detectedObjects)
      ? data.detectedObjects
      : []
    const processingTime = Number(data.processingTime) || 0

    const scan = await Scan.create({
      user: req.user._id,
      detectedObjects,
      processingTime,
      status: 'success',
    })

    await AuditLog.create({
      user: req.user._id,
      action: 'SCAN_CREATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: {
        objectCount: detectedObjects.length,
        scanId: scan._id,
      },
    })

    res.json({
      scanId: scan._id,
      detectedObjects,
      objectCount:
        typeof data.objectCount === 'number'
          ? data.objectCount
          : detectedObjects.length,
      processingTime,
      modelVersion: data.modelVersion || 'unknown',
    })
  } catch (err) {
    console.error('Detection error:', err.response?.data || err.message)

    try {
      await AuditLog.create({
        user: req.user?._id,
        action: 'SCAN_FAILED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: {
          error: err.response?.data || err.message,
        },
      })
    } catch (_) {}

    res.status(500).json({
      message: err.response?.data?.message || 'Detection failed',
      error: err.response?.data || err.message,
    })
  }
}

exports.getHealth = async (req, res) => {
  try {
    const mlApiUrl = process.env.ML_API_URL
    if (!mlApiUrl) {
      return res.status(500).json({
        status: 'error',
        message: 'ML_API_URL is not configured',
      })
    }

    const { data } = await axios.get(`${mlApiUrl}/health`, {
      timeout: 10000,
    })

    res.json({
      status: 'ok',
      mlService: data,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'ML service is not reachable',
      error: err.response?.data || err.message,
    })
  }
}

// ── USER CONTROLLER ───────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  res.json(req.user)
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      {
        new: true,
        select: '-password -otpCode -passwordResetToken',
      }
    )

    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: req.body },
      {
        new: true,
        select: '-password -otpCode',
      }
    )

    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res
        .status(401)
        .json({ message: 'Current password is incorrect' })
    }

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 8 characters' })
    }

    user.password = newPassword
    await user.save()
    await RefreshToken.deleteMany({ user: user._id })

    res.json({ message: 'Password updated successfully. Please sign in again.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── ADMIN CONTROLLER ──────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const [users, total] = await Promise.all([
      User.find()
        .select('-password -otpCode -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(),
    ])

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.toggleBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block admin accounts' })
    }

    user.isBlocked = !user.isBlocked
    await user.save()

    res.json({
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      isBlocked: user.isBlocked,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin accounts' })
    }

    const userScans = await Scan.find({ user: req.params.id }).select('imageUrl')
    await Promise.allSettled(userScans.map((scan) => deleteStoredImage(scan.imageUrl)))

    await Promise.all([
      user.deleteOne(),
      Scan.deleteMany({ user: req.params.id }),
      AuditLog.deleteMany({ user: req.params.id }),
    ])

    res.json({ message: 'User and all associated data deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getModelStats = async (req, res) => {
  try {
    const [totalScans, avgTime, topLabels, totalObjectsAgg, detectedScans, multiObjectScans] = await Promise.all([
      Scan.countDocuments({ status: 'success' }),
      Scan.aggregate([
        { $group: { _id: null, avg: { $avg: '$processingTime' } } },
      ]),
      Scan.aggregate([
        { $unwind: '$detectedObjects' },
        {
          $group: {
            _id: '$detectedObjects.label',
            count: { $sum: 1 },
            avgConf: { $avg: '$detectedObjects.confidence' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Scan.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$objectCount' } } },
      ]),
      Scan.countDocuments({ status: 'success', objectCount: { $gt: 0 } }),
      Scan.countDocuments({ status: 'success', objectCount: { $gt: 1 } }),
    ])

    const totalObjects = totalObjectsAgg[0]?.total || 0
    const weightedConfidence = topLabels.reduce((sum, item) => sum + (item.avgConf || 0) * item.count, 0)
    const averageConfidence = totalObjects ? (weightedConfidence / totalObjects) * 100 : 0
    const detectionRate = totalScans ? (detectedScans / totalScans) * 100 : 0
    const multiObjectRate = totalScans ? (multiObjectScans / totalScans) * 100 : 0
    const top1Share = totalObjects && topLabels[0] ? (topLabels[0].count / totalObjects) * 100 : 0
    const top3Share = totalObjects ? (topLabels.slice(0, 3).reduce((sum, item) => sum + item.count, 0) / totalObjects) * 100 : 0
    const top5Share = totalObjects ? (topLabels.slice(0, 5).reduce((sum, item) => sum + item.count, 0) / totalObjects) * 100 : 0

    const breakdownBase = topLabels.slice(0, 4).map((item) => ({
      name: item._id,
      value: item.count,
      confidence: Math.round((item.avgConf || 0) * 100),
    }))
    const otherCount = Math.max(0, totalObjects - breakdownBase.reduce((sum, item) => sum + item.value, 0))
    const detectionBreakdown = otherCount
      ? [...breakdownBase, { name: 'Other', value: otherCount, confidence: 0 }]
      : breakdownBase

    const radarMetrics = [
      { metric: 'Avg Conf', value: Number(averageConfidence.toFixed(1)) },
      { metric: 'Detection Rate', value: Number(detectionRate.toFixed(1)) },
      { metric: 'Multi-Obj', value: Number(multiObjectRate.toFixed(1)) },
      { metric: 'Top 1 Share', value: Number(top1Share.toFixed(1)) },
      { metric: 'Top 3 Share', value: Number(top3Share.toFixed(1)) },
      { metric: 'Top 5 Share', value: Number(top5Share.toFixed(1)) },
    ]

    res.json({
      totalScans,
      averageProcessingTime: avgTime[0]?.avg?.toFixed(2) || 0,
      averageConfidence: averageConfidence.toFixed(1),
      totalObjects,
      detectionRate: detectionRate.toFixed(1),
      topDetectedObjects: topLabels,
      radarMetrics,
      detectionBreakdown,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)

    res.json({ logs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
