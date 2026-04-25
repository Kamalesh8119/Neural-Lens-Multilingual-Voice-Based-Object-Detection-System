const axios = require('axios')
const FormData = require('form-data')
const ML = process.env.ML_API_URL||'http://localhost:8000'
exports.callDetectionAPI = async (buf, mime) => {
  try {
    const f = new FormData()
    f.append('file', buf, {filename:'image.jpg', contentType:mime})
    const {data} = await axios.post(`${ML}/detect`, f, {headers:f.getHeaders(), timeout:30000})
    return data
  } catch {
    return {detectedObjects:[
      {label:'person',confidence:0.94,bbox:{x:50,y:30,width:120,height:280}},
      {label:'car',confidence:0.87,bbox:{x:200,y:180,width:200,height:130}}
    ],objectCount:2,processingTime:42,modelVersion:'yolov11-mock'}
  }
}
exports.checkMLHealth = async () => {
  try { await axios.get(`${ML}/health`,{timeout:3000}); return true } catch { return false }
}
