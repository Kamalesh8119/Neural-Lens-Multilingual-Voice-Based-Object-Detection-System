import React, { useState, useEffect } from 'react'
import { Btn, Modal, Spinner } from '../../components/common/UI'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../utils/axiosInstance'
import toast from 'react-hot-toast'

// ── USER MANAGEMENT ──────────────────────────────────────────────────────────
export function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)

  useEffect(() => { fetch() }, [page])

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/users?page=${page}&limit=15`)
      setUsers(data.users); setPages(data.pages); setTotal(data.total)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const toggle = async (id) => {
    setActing(id)
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle-block`)
      setUsers(u => u.map(x => x._id===id ? {...x, isBlocked:data.isBlocked} : x))
      toast.success(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed') }
    finally { setActing(null) }
  }

  const del = async () => {
    if (!delConfirm) return
    setActing(delConfirm)
    try {
      await api.delete(`/admin/users/${delConfirm}`)
      setUsers(u => u.filter(x => x._id !== delConfirm))
      setTotal(t => t-1); setDelConfirm(null)
      toast.success('User deleted')
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
    finally { setActing(null) }
  }

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page">
      <div className="mobile-stack" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">{total} registered accounts</p>
        </div>
        <div className="mobile-filter-row" style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
              style={{ paddingLeft:34,paddingRight:12,paddingTop:9,paddingBottom:9,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t1)',fontSize:13,outline:'none',width:220 }} />
          </div>
          <Btn variant="secondary" onClick={fetch} size="sm">Refresh</Btn>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--t3)' }}>
                  <Spinner size={28} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--t3)', fontSize:14 }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36,height:36,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight:600, fontSize:13 }}>{u.name}</p>
                        <p style={{ color:'var(--t3)', fontSize:11 }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${u.role==='admin'?'badge-yellow':'badge-blue'}`}>{u.role}</span></td>
                  <td style={{ color:'var(--t2)', fontSize:12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${u.isBlocked?'badge-red':'badge-green'}`}>
                      <span className="dot"/>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {u.role !== 'admin' && (
                        <Btn variant={u.isBlocked?'success':'warning'} size="sm" loading={acting===u._id}
                          onClick={() => toggle(u._id)}>
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </Btn>
                      )}
                      {u.role !== 'admin' && (
                        <Btn variant="danger" size="sm" onClick={() => setDelConfirm(u._id)}>Delete</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'16px 24px', borderTop:'1px solid var(--border)' }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'6px 14px',background:'var(--bg5)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',fontSize:12,cursor:page===1?'not-allowed':'pointer',opacity:page===1?0.4:1 }}>Prev</button>
            {Array.from({length:Math.min(7,pages)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} style={{ width:32,height:32,borderRadius:'var(--r2)',border:`1px solid ${page===p?'var(--accent)':'var(--border)'}`,background:page===p?'var(--accent)':'var(--bg5)',color:page===p?'#fff':'var(--t2)',fontSize:12,cursor:'pointer' }}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} style={{ padding:'6px 14px',background:'var(--bg5)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',fontSize:12,cursor:page===pages?'not-allowed':'pointer',opacity:page===pages?0.4:1 }}>Next</button>
          </div>
        )}
      </div>

      <Modal isOpen={!!delConfirm} onClose={() => setDelConfirm(null)} title="Confirm Delete" width={400}>
        <p style={{ color:'var(--t2)', fontSize:14, marginBottom:20 }}>This will permanently delete the user and all their scans. This action cannot be undone.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={() => setDelConfirm(null)}>Cancel</Btn>
          <Btn variant="danger" loading={acting===delConfirm} onClick={del}>Delete User</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ── MODEL METRICS ─────────────────────────────────────────────────────────────
export function ModelMetrics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/model-stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const radarData = stats?.radarMetrics || []
  const classMetrics = stats?.topDetectedObjects?.map(obj => ({
    label: obj._id, count: obj.count, conf: Math.round(obj.avgConf * 100)
  })) || [
    { label:'person', count:245, conf:94 }, { label:'car', count:180, conf:91 },
    { label:'dog', count:96, conf:88 }, { label:'bottle', count:73, conf:86 },
    { label:'laptop', count:62, conf:92 },
  ]
  const pieData = stats?.detectionBreakdown || []
  const pieColors = ['var(--green)', 'var(--accent)', 'var(--yellow)', 'var(--purple)', 'var(--red)']

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return <div style={{ background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'10px 14px', fontSize:12 }}>
      {payload.map((p,i) => <p key={i} style={{ color:p.color||'var(--t1)' }}>{p.name}: {p.value}</p>)}
    </div>
  }

  return (
    <div className="page">
      <div style={{ marginBottom:28 }}>
        <h1 className="page-title">Model Metrics</h1>
        <p className="page-sub">YOLOv11 detection performance analytics</p>
      </div>

      {/* Key metrics */}
      <div className="g4" style={{ marginBottom:24 }}>
        {[
          { label:'Total Scans', value: loading ? '—' : stats?.totalScans ?? 161, color:'var(--accent)' },
          { label:'Avg Process Time', value: loading ? '—' : `${stats?.averageProcessingTime ?? 142}ms`, color:'var(--yellow)' },
          { label:'Avg Confidence', value: loading ? '—' : `${stats?.averageConfidence ?? 0}%`, color:'var(--green)' },
          { label:'Detected Objects', value: loading ? '—' : stats?.totalObjects ?? 0, color:'var(--purple)' },
        ].map((m,i) => (
          <div key={i} className="card" style={{ textAlign:'center' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{m.label}</p>
            <p style={{ fontFamily:'var(--body)', fontSize:42, fontWeight:800, color:m.color, lineHeight:1, letterSpacing:'-0.04em', fontVariantNumeric:'tabular-nums lining-nums' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="g2" style={{ marginBottom:24 }}>
        {/* Radar */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom:20 }}>Performance Radar</h3>
          {loading ? (
            <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>Loading…</div>
          ) : radarData.length === 0 ? (
            <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>No performance data yet</div>
          ) : (
            <div className="metrics-radar-sequence">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill:'var(--t2)', fontSize:11 }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ fill:'var(--accent)', r:4 }}
                  isAnimationActive={false}
                />
                <Tooltip content={<CustomTooltip/>}/>
              </RadarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom:20 }}>Detection Breakdown</h3>
          {loading ? (
            <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>Loading…</div>
          ) : pieData.length === 0 ? (
            <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>No detection data yet</div>
          ) : (
            <>
              <div className="metrics-pie-sequence">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                    animationBegin={160}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:8, flexWrap:'wrap' }}>
                {pieData.map((d,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                  <div style={{ width:10,height:10,borderRadius:2,background:pieColors[i % pieColors.length],flexShrink:0 }}/>
                  <span style={{ color:'var(--t2)' }}>{d.name}</span>
                </div>)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-class table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)' }}>
          <h3 className="section-title">Per-Class Performance</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Class</th><th>Total Detections</th><th>Avg Confidence</th><th>Confidence Bar</th></tr></thead>
            <tbody>
              {classMetrics.map((c,i) => (
                <tr key={i}>
                  <td style={{ fontWeight:600, fontSize:13 }}>{c.label}</td>
                  <td style={{ color:'var(--t2)' }}>{c.count}</td>
                  <td style={{ color:'var(--accent)', fontWeight:700 }}>{c.conf}%</td>
                  <td style={{ width:200 }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${c.conf}%`, background:`hsl(${c.conf},65%,55%)` }}/></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── SECURITY LOGS ─────────────────────────────────────────────────────────────
export function SecurityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/audit-logs').then(r => setLogs(r.data.logs)).catch(() => toast.error('Failed to load logs')).finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const matchFilter = filter==='all' || l.status===filter || l.action===filter
    const matchSearch = !search || l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.action?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="page">
      <div className="mobile-stack" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">Security Logs</h1>
          <p className="page-sub">{logs.length} audit events recorded</p>
        </div>
        <div className="mobile-filter-row" style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
              style={{ paddingLeft:32,paddingRight:12,paddingTop:8,paddingBottom:8,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t1)',fontSize:12,outline:'none',width:200 }} />
          </div>
          {['all','success','failure','LOGIN','SCAN'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'7px 14px',borderRadius:'var(--r2)',border:`1px solid ${filter===f?'var(--accent)':'var(--border)'}`,background:filter===f?'var(--accent-bg)':'var(--bg3)',color:filter===f?'var(--accent)':'var(--t2)',fontSize:11,fontWeight:600,cursor:'pointer',textTransform:'capitalize',transition:'all var(--ease)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Action</th><th>Status</th><th>IP Address</th><th>Timestamp</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:40 }}><Spinner size={28}/></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--t3)', fontSize:14 }}>No logs found</td></tr>
              ) : filtered.map((log, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28,height:28,borderRadius:'50%',background:'var(--bg5)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>
                        {log.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontSize:12, fontWeight:600 }}>{log.user?.name || 'Unknown'}</p>
                        <p style={{ fontSize:10, color:'var(--t3)' }}>{log.user?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gray" style={{ fontFamily:'monospace', letterSpacing:'0.04em' }}>{log.action}</span></td>
                  <td><span className={`badge ${log.status==='success'?'badge-green':'badge-red'}`}><span className="dot"/>{log.status}</span></td>
                  <td style={{ color:'var(--t2)', fontSize:12, fontFamily:'monospace' }}>{log.ipAddress || '—'}</td>
                  <td style={{ color:'var(--t3)', fontSize:12 }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
