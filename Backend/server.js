const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const rateLimit= require('express-rate-limit')
const mongoose = require('mongoose')
const fs       = require('fs')
const path     = require('path')
require('dotenv').config()

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'neurallens_jwt_secret_change_this_in_production_32chars'
  console.warn('[DEV] JWT_SECRET missing; using development fallback secret.')
}

if (!process.env.REFRESH_TOKEN_SECRET) {
  process.env.REFRESH_TOKEN_SECRET = 'neurallens_refresh_secret_change_32chars'
  console.warn('[DEV] REFRESH_TOKEN_SECRET missing; using development fallback secret.')
}

if (!process.env.CLIENT_URL) {
  process.env.CLIENT_URL = 'http://localhost:5173'
}

const app = express()
const clientDistPath = path.resolve(__dirname, '../client/dist')
const hasBuiltClient = fs.existsSync(path.join(clientDistPath, 'index.html'))
const uploadsPath = path.resolve(__dirname, 'uploads')

app.use(helmet())
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173',credentials:true}))
app.use(express.json({limit:'15mb'}))
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static(uploadsPath))
app.use('/api/',rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}))
app.use('/api',require('./routes'))

if (hasBuiltClient) {
  app.use(express.static(clientDistPath))
  app.get(/^\/(?!api).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

app.use((err,req,res,next)=>res.status(err.status||500).json({message:err.message||'Server error'}))
mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/neural_lens')
  .then(()=>{console.log('MongoDB connected');app.listen(process.env.PORT||5000,()=>console.log('Server on :5000'))})
  .catch(e=>{console.error(e.message);process.exit(1)})
