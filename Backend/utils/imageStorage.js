const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cloudinary = require('cloudinary').v2

const uploadsRoot = path.join(__dirname, '..', 'uploads')
const scansRoot = path.join(uploadsRoot, 'scans')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function extensionFromMime(mimetype = '') {
  const normalized = mimetype.toLowerCase()
  if (normalized.includes('png')) return '.png'
  if (normalized.includes('webp')) return '.webp'
  if (normalized.includes('gif')) return '.gif'
  return '.jpg'
}

function getServerBaseUrl(req) {
  return process.env.SERVER_PUBLIC_URL || `${req.protocol}://${req.get('host')}`
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

async function uploadToCloudinary(imageBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'neural-lens/scans', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(imageBuffer)
  })
}

async function saveImageWithFallback({ imageBuffer, mimetype, req }) {
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadToCloudinary(imageBuffer)
      return {
        imageUrl: result.secure_url,
        storage: 'cloudinary',
      }
    } catch (error) {
      console.warn('Cloudinary upload failed, using local fallback:', error.message)
    }
  } else {
    console.warn('Cloudinary is not configured, using local fallback storage.')
  }

  ensureDir(scansRoot)

  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionFromMime(mimetype)}`
  const absolutePath = path.join(scansRoot, filename)
  fs.writeFileSync(absolutePath, imageBuffer)

  return {
    imageUrl: `${getServerBaseUrl(req)}/uploads/scans/${filename}`,
    storage: 'local',
  }
}

async function deleteStoredImage(imageUrl = '') {
  if (!imageUrl || typeof imageUrl !== 'string') return

  if (imageUrl.includes('/uploads/scans/')) {
    try {
      const pathname = new URL(imageUrl, 'http://localhost').pathname
      const fileName = path.basename(pathname)
      const absolutePath = path.join(scansRoot, fileName)

      if (absolutePath.startsWith(scansRoot) && fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath)
      }
    } catch (error) {
      console.warn('Failed to remove local fallback image:', error.message)
    }
  }
}

module.exports = {
  uploadsRoot,
  saveImageWithFallback,
  deleteStoredImage,
}
