// ── DETECTION CONTROLLER ──────────────────────────────────────────────────────
const { Scan } = require('../models')
const { callDetectionAPI, checkMLHealth } = require('../services/mlService')
const { saveImageWithFallback } = require('../utils/imageStorage')

exports.detectObjects = async (req, res) => {
  try {
    let imageBuffer, mimetype

    if (req.file) {
      imageBuffer = req.file.buffer
      mimetype    = req.file.mimetype
    } else if (req.body.image) {
      const b64 = req.body.image.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(b64, 'base64')
      mimetype    = 'image/jpeg'
    } else {
      return res.status(400).json({ message: 'No image provided' })
    }

    const { imageUrl } = await saveImageWithFallback({
      imageBuffer,
      mimetype,
      req,
    })

    const mlResult = await callDetectionAPI(imageBuffer, mimetype)

    let scanId = null
    try {
      const scan = await Scan.create({
        user:            req.user?._id,
        imageUrl,
        sourceType:      req.body.sourceType || 'upload',
        detectedObjects: mlResult.detectedObjects || [],
        objectCount:     mlResult.objectCount || 0,
        processingTime:  mlResult.processingTime,
        modelVersion:    mlResult.modelVersion || 'yolov11',
      })
      scanId = scan._id
    } catch (saveErr) {
      console.warn('Detection succeeded, but scan history save failed:', saveErr.message)
    }

    res.json({ scanId, imageUrl, ...mlResult })
  } catch (err) {
    console.error('Detection error:', err.response?.data || err.message)
    res.status(500).json({ message: err.response?.data?.detail || err.message || 'Detection failed' })
  }
}

exports.getHealth = async (req, res) => {
  const healthy = await checkMLHealth()
  res.json({ status: healthy ? 'ok' : 'ml_offline', mlService: healthy })
}

module.exports.detectObjects = exports.detectObjects
module.exports.getHealth = exports.getHealth
