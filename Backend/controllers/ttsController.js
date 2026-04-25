const { getSpeechAudioBuffer } = require('../services/ttsService')

exports.speak = async (req, res) => {
  try {
    const { text, lang } = req.body || {}
    const buffer = await getSpeechAudioBuffer(text, lang)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.send(buffer)
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to generate speech audio',
    })
  }
}
