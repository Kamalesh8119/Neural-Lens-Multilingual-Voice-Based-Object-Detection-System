import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Btn, Input, Modal, Spinner } from '../../components/common/UI'
import api from '../../utils/axiosInstance'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const COUNTRY_CODES = [
  { code:'+1',  label:'US / CA (+1)' },
  { code:'+44', label:'UK (+44)' },
  { code:'+61', label:'Australia (+61)' },
  { code:'+65', label:'Singapore (+65)' },
  { code:'+81', label:'Japan (+81)' },
  { code:'+91', label:'India (+91)' },
  { code:'+971', label:'UAE (+971)' },
]

function splitPhoneNumber(phone = '') {
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
  const normalized = phone.trim()
  const matched = sortedCodes.find((item) => normalized.startsWith(item.code))

  if (matched) {
    return {
      countryCode: matched.code,
      localNumber: normalized.slice(matched.code.length).trim(),
    }
  }

  return {
    countryCode: '+91',
    localNumber: normalized.replace(/^\+/, '').trim(),
  }
}

// ── SCAN HISTORY ──────────────────────────────────────────────────────────────
export function ScanHistory() {
  const [scans,setScans] = useState([])
  const [loading,setLoading] = useState(true)
  const [refreshing,setRefreshing] = useState(false)
  const [page,setPage] = useState(1)
  const [total,setTotal] = useState(0)
  const [pages,setPages] = useState(1)
  const [selected,setSelected] = useState(null)
  const [deleting,setDeleting] = useState(null)

  useEffect(()=>{fetchScans()},[page])

  const fetchScans = async () => {
    const showInitialLoader = scans.length === 0
    if (showInitialLoader) setLoading(true)
    else setRefreshing(true)
    try {
      const {data} = await api.get(`/scans?page=${page}&limit=10`)
      setScans(data.scans); setTotal(data.total); setPages(data.pages)
    } catch { toast.error('Failed to load history') }
    finally { setLoading(false); setRefreshing(false) }
  }

  const del = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/scans/${id}`)
      setScans(s=>s.filter(x=>x._id!==id)); setTotal(t=>t-1)
      if (selected?._id===id) setSelected(null)
      toast.success('Scan deleted')
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  return (
    <div className="page">
      <div className="mobile-stack" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,flexWrap:'wrap',gap:12}}>
        <div><h1 className="page-title">Scan History</h1><p className="page-sub">{total} total scan{total!==1?'s':''}</p></div>
        <Btn variant="secondary" onClick={fetchScans} size="sm" loading={refreshing}>↻ Refresh</Btn>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[1,2,3,4,5].map(i=><div key={i} style={{height:90,borderRadius:'var(--r3)'}} className="skeleton"/>)}
        </div>
      ) : scans.length===0 ? (
        <div className="card" style={{textAlign:'center',padding:'60px 24px'}}>
          <div style={{width:64,height:64,background:'var(--bg5)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,marginBottom:8}}>No scans yet</p>
          <p style={{color:'var(--t2)',fontSize:13}}>Your detection history will appear here</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10,opacity:refreshing?0.72:1,transition:'opacity 180ms ease'}}>
          {scans.map(scan=>(
            <div key={scan._id} onClick={()=>setSelected(scan)}
              className="mobile-stack-tight"
              style={{display:'flex',alignItems:'center',gap:16,padding:'14px 18px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r3)',cursor:'pointer',transition:'all var(--ease)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg4)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--bg3)'}>
              <img src={scan.imageUrl} alt="thumb" style={{width:64,height:64,objectFit:'cover',borderRadius:'var(--r2)',border:'1px solid var(--border)',flexShrink:0}} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                  <span className={`badge ${scan.sourceType==='camera'?'badge-blue':'badge-gray'}`}>{scan.sourceType}</span>
                  <span style={{fontSize:11,color:'var(--t3)'}}>{new Date(scan.createdAt).toLocaleString()}</span>
                  <span style={{fontSize:11,color:'var(--t3)'}}>{scan.processingTime}ms</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {scan.detectedObjects.slice(0,5).map((obj,i)=>(
                    <span key={i} style={{fontSize:11,padding:'2px 8px',background:'var(--bg5)',border:'1px solid var(--border)',borderRadius:100,color:'var(--t2)'}}>
                      {obj.label} <span style={{color:'var(--accent)'}}>{(obj.confidence*100).toFixed(0)}%</span>
                    </span>
                  ))}
                  {scan.detectedObjects.length>5 && <span style={{fontSize:11,color:'var(--t3)'}}>+{scan.detectedObjects.length-5} more</span>}
                </div>
              </div>
              <div className="mobile-inline-actions" style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                <span style={{width:28,height:28,background:'var(--accent-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--accent)'}}>{scan.objectCount}</span>
                <button onClick={e=>{e.stopPropagation();del(scan._id)}} disabled={deleting===scan._id}
                  style={{width:32,height:32,borderRadius:'var(--r1)',background:'none',border:'1px solid transparent',color:'var(--t3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all var(--ease)'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--red-bg)';e.currentTarget.style.color='var(--red)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--t3)'}}>
                  {deleting===scan._id?<Spinner size={13}/>:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
                </button>
              </div>
            </div>
          ))}
          {pages>1 && (
            <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:16}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'7px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',cursor:page===1?'not-allowed':'pointer',opacity:page===1?0.4:1,fontSize:12}}>Prev</button>
              {Array.from({length:Math.min(7,pages)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{width:34,height:34,borderRadius:'var(--r2)',border:`1px solid ${page===p?'var(--accent)':'var(--border)'}`,background:page===p?'var(--accent)':'var(--bg3)',color:page===p?'#fff':'var(--t2)',fontSize:12,cursor:'pointer'}}>{p}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} style={{padding:'7px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',cursor:page===pages?'not-allowed':'pointer',opacity:page===pages?0.4:1,fontSize:12}}>Next</button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title="Scan Detail" width={560}>
        {selected && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <img src={selected.imageUrl} style={{width:'100%',borderRadius:'var(--r2)',border:'1px solid var(--border)',maxHeight:260,objectFit:'contain',background:'var(--bg5)'}} />
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {[{k:'Source',v:selected.sourceType},{k:'Objects',v:selected.objectCount},{k:'Time',v:`${selected.processingTime}ms`},{k:'Model',v:selected.modelVersion}].map(({k,v})=>(
                <div key={k} style={{padding:'8px 14px',background:'var(--bg5)',border:'1px solid var(--border)',borderRadius:'var(--r2)'}}>
                  <p style={{fontSize:10,color:'var(--t3)',fontWeight:600,marginBottom:2}}>{k}</p>
                  <p style={{fontSize:13,fontWeight:600,textTransform:'capitalize'}}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {selected.detectedObjects.map((obj,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--bg5)',border:'1px solid var(--border)',borderRadius:'var(--r2)'}}>
                  <span style={{flex:1,fontSize:13,fontWeight:500}}>{obj.label}</span>
                  <div className="progress-bar" style={{flex:1}}><div className="progress-fill" style={{width:`${obj.confidence*100}%`,background:`hsl(${obj.confidence*120},65%,55%)`}}/></div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--accent)',minWidth:44,textAlign:'right'}}>{(obj.confidence*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
export function Profile() {
  const {user,updateUser,logout} = useAuth()
  const navigate = useNavigate()
  const [form,setForm] = useState({name:user?.name||'',phone:user?.phone||''})
  const [pw,setPw] = useState({current:'',newPass:'',confirm:''})
  const [saving,setSaving] = useState(false)
  const [pwSaving,setPwSaving] = useState(false)
  const [countryCode, setCountryCode] = useState('+91')
  const [localPhone, setLocalPhone] = useState('')
  const [phoneLocked, setPhoneLocked] = useState(Boolean(user?.phone))

  useEffect(() => {
    const parsedPhone = splitPhoneNumber(user?.phone || '')
    setForm({ name: user?.name || '', phone: user?.phone || '' })
    setCountryCode(parsedPhone.countryCode)
    setLocalPhone(parsedPhone.localNumber)
    setPhoneLocked(Boolean(user?.phone))
  }, [user])

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const nextPhone = localPhone.trim() ? `${countryCode} ${localPhone.trim()}` : ''
      const payload = { ...form, phone: nextPhone }
      const {data}=await api.put('/users/profile',payload)
      updateUser(data.user)
      setPhoneLocked(Boolean(data.user?.phone))
      toast.success('Profile updated')
    }
    catch(err){ toast.error(err.response?.data?.message||'Update failed') }
    finally { setSaving(false) }
  }
  const changePw = async (e) => {
    e.preventDefault()
    if (pw.newPass!==pw.confirm) return toast.error('Passwords do not match')
    if (pw.newPass.length<8) return toast.error('Min 8 characters')
    if (pw.current === pw.newPass) return toast.error('New password must be different')
    setPwSaving(true)
    try {
      const { data } = await api.put('/users/change-password',{currentPassword:pw.current,newPassword:pw.newPass})
      setPw({current:'',newPass:'',confirm:''})
      await logout()
      toast.success(data.message || 'Password updated successfully. Please sign in again.')
      navigate('/login', { replace: true })
    }
    catch(err){ toast.error(err.response?.data?.message||'Failed') }
    finally { setPwSaving(false) }
  }

  return (
    <div className="page page-md">
      <div style={{marginBottom:28}}><h1 className="page-title">Profile</h1><p className="page-sub">Manage your personal information</p></div>

      <div className="card" style={{marginBottom:20,background:'linear-gradient(135deg,var(--bg3),var(--bg4))',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-40,top:-40,width:200,height:200,borderRadius:'50%',background:'var(--accent-glow)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:20,position:'relative'}}>
          <div style={{width:76,height:76,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#6b9fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:800,color:'#fff',boxShadow:'0 0 28px var(--accent-glow)',fontFamily:'var(--display)',flexShrink:0}}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{fontFamily:'var(--display)',fontSize:22,fontWeight:800,marginBottom:4}}>{user?.name}</p>
            <p style={{color:'var(--t2)',fontSize:13,marginBottom:8}}>{user?.email}</p>
            <div style={{display:'flex',gap:8}}>
              <span className={`badge ${user?.role==='admin'?'badge-yellow':'badge-blue'}`}>{user?.role}</span>
              <span className="badge badge-green"><span className="dot"/>2FA Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <h3 className="section-title" style={{marginBottom:18}}>Personal Information</h3>
          <form onSubmit={saveProfile} style={{display:'flex',flexDirection:'column',gap:14}}>
            <Input label="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name"/>
            <Input label="Email" value={user?.email} disabled hint="Email cannot be changed"/>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--t2)', letterSpacing:'0.02em' }}>Phone</label>
              <div className="mobile-profile-phone" style={{display:'grid',gridTemplateColumns:'150px 1fr auto',gap:10,alignItems:'center'}}>
                <select
                  value={countryCode}
                  disabled={phoneLocked}
                  onChange={e=>setCountryCode(e.target.value)}
                  style={{
                    width:'100%',
                    padding:'11px 14px',
                    background:'var(--bg5)',
                    border:`1px solid ${phoneLocked ? 'var(--border)' : 'var(--border)'}`,
                    borderRadius:'var(--r2)',
                    color:'var(--t1)',
                    fontSize:13,
                    outline:'none',
                    opacity: phoneLocked ? 0.7 : 1,
                  }}
                >
                  {COUNTRY_CODES.map(item => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  value={localPhone}
                  disabled={phoneLocked}
                  onChange={e=>setLocalPhone(e.target.value.replace(/[^\d\s()-]/g,''))}
                  placeholder="Enter your phone number"
                  style={{
                    width:'100%',
                    padding:'11px 14px',
                    background:'var(--bg5)',
                    border:'1px solid var(--border)',
                    borderRadius:'var(--r2)',
                    color:'var(--t1)',
                    fontSize:13,
                    outline:'none',
                    opacity: phoneLocked ? 0.7 : 1,
                  }}
                />
                <Btn
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPhoneLocked(false)
                    setLocalPhone('')
                  }}
                >
                  Re-enter
                </Btn>
              </div>
              {phoneLocked && <span style={{ fontSize:11, color:'var(--t3)' }}>Phone number is locked after save. Use Re-enter to change it.</span>}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end'}}><Btn type="submit" loading={saving}>Save Changes</Btn></div>
          </form>
        </div>
        <div className="card">
          <h3 className="section-title" style={{marginBottom:18}}>Change Password</h3>
          <form onSubmit={changePw} style={{display:'flex',flexDirection:'column',gap:14}}>
            <Input label="Current password" type="password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} placeholder="Current password"/>
            <Input label="New password" type="password" value={pw.newPass} onChange={e=>setPw(p=>({...p,newPass:e.target.value}))} placeholder="Min. 8 characters"/>
            <Input label="Confirm new password" type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password"/>
            <div style={{display:'flex',justifyContent:'flex-end'}}><Btn type="submit" loading={pwSaving}>Update Password</Btn></div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
export function Settings() {
  const {user,updateUser} = useAuth()
  const {theme,toggleTheme} = useTheme()
  const [s,setS] = useState({notifications:user?.settings?.notifications??true,emailAlerts:user?.settings?.emailAlerts??true})
  const [saving,setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try { const {data}=await api.put('/users/settings',s); updateUser(data.user); toast.success('Settings saved') }
    catch { toast.error('Save failed') } finally { setSaving(false) }
  }

  const Toggle = ({label,desc,val,onChange}) => (
    <div className="mobile-toggle-row" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
      <div><p style={{fontSize:14,fontWeight:500,marginBottom:2}}>{label}</p>{desc&&<p style={{fontSize:12,color:'var(--t3)'}}>{desc}</p>}</div>
      <button onClick={()=>onChange(!val)} style={{width:44,height:24,background:val?'var(--accent)':'var(--bg5)',border:`1px solid ${val?'var(--accent)':'var(--border)'}`,borderRadius:12,cursor:'pointer',position:'relative',transition:'all var(--ease)',flexShrink:0}}>
        <span style={{position:'absolute',top:2,left:val?22:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left var(--ease)'}}/>
      </button>
    </div>
  )

  return (
    <div className="page page-md">
      <div style={{marginBottom:28}}><h1 className="page-title">Settings</h1><p className="page-sub">Customize your experience</p></div>
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <div className="card">
          <h3 className="section-title" style={{marginBottom:14}}>Appearance</h3>
          <div className="mobile-toggle-row" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
            <div><p style={{fontSize:14,fontWeight:500,marginBottom:2}}>Theme</p><p style={{fontSize:12,color:'var(--t3)'}}>Currently: {theme} mode</p></div>
            <Btn variant="secondary" size="sm" onClick={toggleTheme}>{theme==='dark'?'Switch to Light':'Switch to Dark'}</Btn>
          </div>
        </div>
        <div className="card">
          <h3 className="section-title" style={{marginBottom:4}}>Security</h3>
          <div style={{padding:'14px 16px',background:'var(--green-bg)',border:'1px solid var(--green)30',borderRadius:'var(--r2)',margin:'14px 0',display:'flex',gap:12,alignItems:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <p style={{fontSize:13,fontWeight:600,color:'var(--green)'}}>Two-Factor Authentication is Active</p>
              <p style={{fontSize:12,color:'var(--t2)'}}>Every login requires an email verification code.</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="section-title" style={{marginBottom:4}}>Notifications</h3>
          <Toggle label="In-app notifications" desc="Show alerts for detection completions" val={s.notifications} onChange={v=>setS(x=>({...x,notifications:v}))}/>
          <Toggle label="Email alerts" desc="Receive weekly activity summaries" val={s.emailAlerts} onChange={v=>setS(x=>({...x,emailAlerts:v}))}/>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end'}}><Btn onClick={save} loading={saving} size="lg">Save Settings</Btn></div>
      </div>
    </div>
  )
}
