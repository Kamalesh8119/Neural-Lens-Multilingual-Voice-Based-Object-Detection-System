require('dotenv').config()
const mongoose = require('mongoose')
const {User} = require('../models')
mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/neural_lens').then(async () => {
  await User.deleteMany({email:{$in:['admin@demo.com','user@demo.com']}})
  await User.create([
    {name:'Admin User',email:'admin@demo.com',password:'Admin123',role:'admin'},
    {name:'Demo User', email:'user@demo.com', password:'Password123',role:'user'},
  ])
  console.log('✅ Seeded: admin@demo.com / Admin123 | user@demo.com / Password123')
  process.exit(0)
}).catch(e=>{console.error(e.message);process.exit(1)})
