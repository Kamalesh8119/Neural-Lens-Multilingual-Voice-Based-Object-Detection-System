const googleTTS = require('google-tts-api')

const LANGUAGE_MAP = {
  'en-IN': 'en',
  'hi-IN': 'hi',
  'te-IN': 'te',
  'ta-IN': 'ta',
  'kn-IN': 'kn',
  'ml-IN': 'ml',
  'bn-IN': 'bn',
  'mr-IN': 'mr',
}

function normalizeLanguage(lang = 'en-IN') {
  return LANGUAGE_MAP[lang] || 'en'
}

async function getSpeechAudioBuffer(text, lang) {
  const trimmedText = String(text || '').trim()

  if (!trimmedText) {
    const error = new Error('Text is required')
    error.status = 400
    throw error
  }

  const base64 = await googleTTS.getAudioBase64(trimmedText, {
    lang: normalizeLanguage(lang),
    slow: false,
    timeout: 15000,
  })

  return Buffer.from(base64, 'base64')
}

module.exports = {
  getSpeechAudioBuffer,
}
