const nodemailer = require('nodemailer')

const emailPort = Number(process.env.EMAIL_PORT || 587)
const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS

const tr = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: emailPort,
  secure: emailPort === 465,
  auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
})

async function sendMail(message) {
  if (!emailUser || !emailPass) {
    console.log(`[DEV] Email skipped for ${message.to}; EMAIL_USER or EMAIL_PASS is missing.`)
    return null
  }

  const info = await tr.sendMail({
    from: process.env.EMAIL_FROM || `"Neural Lens" <${emailUser}>`,
    ...message,
  })
  console.log(`Email accepted for ${message.to}: ${info.accepted?.join(', ') || 'none'}`)
  return info
}

exports.sendOTPEmail = async (email,name,otp) => {
  if (!emailUser || !emailPass) { console.log(`[DEV] OTP for ${email}: ${otp}`); return }
  await sendMail({to:email,subject:'Your Neural Lens verification code',
    html:`<div style="font-family:sans-serif;padding:32px;background:#0d1126;color:#eef0fa;border-radius:16px;max-width:480px;margin:0 auto"><h2 style="color:#4f8bff">Neural Lens — Verify</h2><p>Hi ${name}, your code:</p><div style="text-align:center;padding:24px;background:#1a2040;border:2px solid #4f8bff;border-radius:12px;margin:20px 0"><span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#4f8bff">${otp}</span></div><p style="color:#8896c0;font-size:13px">Expires in 10 minutes.</p></div>`
  })
}
exports.sendPasswordResetEmail = async (email,name,url) => {
  if (!emailUser || !emailPass) { console.log(`[DEV] Reset URL: ${url}`); return }
  await sendMail({to:email,subject:'Reset your Neural Lens password',
    html:`<div style="font-family:sans-serif;padding:32px;background:#0d1126;color:#eef0fa;border-radius:16px;max-width:480px;margin:0 auto"><h2 style="color:#4f8bff">Password Reset</h2><p>Hi ${name},</p><a href="${url}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#4f8bff;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Reset Password</a><p style="color:#8896c0;font-size:12px">Expires in 1 hour.</p></div>`
  })
}
