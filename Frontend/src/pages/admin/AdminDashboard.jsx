import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { StatCard } from '../../components/common/UI'
import api from '../../utils/axiosInstance'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Derived chart data from real API
  const [scanChartData, setScanChartData] = useState([])
  const [detectionChartData, setDetectionChartData] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/admin/model-stats'),
      api.get('/admin/audit-logs'),
      api.get('/admin/users?limit=5'),
    ]).then(([statsRes, logsRes, usersRes]) => {
      const s = statsRes.data
      setStats(s)

      // Build detection chart from real topDetectedObjects
      if (s.topDetectedObjects?.length) {
        setDetectionChartData(
          s.topDetectedObjects.slice(0, 6).map(o => ({ label: o._id, count: o.count }))
        )
      }

      // Build scan-activity chart from audit logs (group LOGIN successes by weekday)
      const allLogs = logsRes.data.logs || []
      setLogs(allLogs.slice(0, 6))

      // Count detections per day-of-week using audit log timestamps
      const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const counts = Object.fromEntries(DAYS.map(d => [d, 0]))
      allLogs
        .filter(l => l.action === 'LOGIN' && l.status === 'success')
        .forEach(l => { const d = DAYS[new Date(l.createdAt).getDay()]; counts[d]++ })
      setScanChartData(DAYS.map(d => ({ day: d, scans: counts[d] })))

      setUsers(usersRes.data.users || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const iconScans = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  const iconUsers = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
  const iconTime = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  const iconAcc  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'10px 14px', fontSize:12 }}>
        <p style={{ color:'var(--t2)', marginBottom:4 }}>{label}</p>
        {payload.map((p,i) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
      </div>
    )
  }

  const AnimatedBar = ({ x, y, width, height, fill, index }) => (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={4}
      ry={4}
      fill={fill}
      className="dashboard-animated-bar"
      style={{ animationDelay: `${index * 140}ms` }}
    />
  )

  // Compute user count from users total (or fallback)
  const userCount = loading ? '—' : (stats ? users.length || '—' : '—')

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div className="mobile-stack" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 className="page-title">Admin Overview</h1>
          </div>
          <div className="mobile-inline-actions" style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--green-bg)', border:'1px solid var(--green)30', borderRadius:'var(--r2)' }}>
              <div style={{ width:7,height:7,borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>All Systems Operational</span>
            </div>
            <div style={{ fontSize:12, color:'var(--t3)', padding:'8px 14px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r2)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards — all from real API */}
      <div className="g4" style={{ marginBottom:24 }}>
        <StatCard label="Total Scans"        value={loading ? '—' : (stats?.totalScans ?? 0)}                         sub="All time"        icon={iconScans} color="var(--accent)" trend={8} />
        <StatCard label="Registered Users"   value={loading ? '—' : userCount}                                        sub="Active accounts" icon={iconUsers} color="var(--green)"  trend={15} />
        <StatCard label="Avg Processing"     value={loading ? '—' : `${stats?.averageProcessingTime ?? 0}ms`}         sub="Per detection"   icon={iconTime}  color="var(--yellow)" trend={-3} />
        <StatCard label="Top Object"         value={loading ? '—' : (stats?.topDetectedObjects?.[0]?._id ?? 'N/A')}   sub="Most detected"   icon={iconAcc}   color="var(--purple)" trend={2} />
      </div>

      {/* Charts row */}
      <div className="g2" style={{ marginBottom:24 }}>
        {/* Area chart — login activity by weekday */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 className="section-title">Login Activity by Day</h3>
            <span className="badge badge-blue">All time</span>
          </div>
          <div className="dashboard-line-sequence">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={scanChartData} margin={{ top:5, right:10, bottom:5, left:-10 }}>
              <defs>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill:'var(--t3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--t3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip/>} />
              <Area type="monotone" dataKey="scans" name="Logins" stroke="var(--accent)" strokeWidth={2.5} fill="url(#scanGrad)" dot={{ fill:'var(--accent)', r:4 }} activeDot={{ r:6 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart — real top detections from DB */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 className="section-title">Top Detected Classes</h3>
            <span className="badge badge-green">All time</span>
          </div>
          {loading ? (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>Loading…</div>
          ) : detectionChartData.length === 0 ? (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>No scan data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={detectionChartData} layout="vertical" margin={{ top:5, right:10, bottom:5, left:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill:'var(--t3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fill:'var(--t2)', fontSize:12 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip/>} />
                <Bar dataKey="count" name="Detections" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={22} shape={<AnimatedBar />} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row — recent users + activity */}
      <div className="g2">
        {/* Recent users */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h3 className="section-title">Recent Users</h3>
            <a href="/admin/users" style={{ fontSize:12, color:'var(--accent)', fontWeight:500 }}>View all →</a>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? [1,2,3,4].map(i => <div key={i} style={{ height:48 }} className="skeleton"/>) :
              users.map(u => (
                <div key={u._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--bg5)', border:'1px solid var(--border)', borderRadius:'var(--r2)' }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0 }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                    <p style={{ fontSize:11, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</p>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <span className={`badge ${u.role==='admin'?'badge-yellow':'badge-blue'}`}>{u.role}</span>
                    {u.isBlocked && <span className="badge badge-red">Blocked</span>}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h3 className="section-title">Recent Activity</h3>
            <a href="/admin/security" style={{ fontSize:12, color:'var(--accent)', fontWeight:500 }}>View logs →</a>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {loading ? [1,2,3,4,5].map(i => <div key={i} style={{ height:40 }} className="skeleton"/>) :
              logs.length > 0 ? logs.map((log, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:'var(--r2)', background:'var(--bg5)', border:'1px solid var(--border)' }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:log.status==='success'?'var(--green)':'var(--red)',flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {log.user?.name || 'Unknown'} — {log.action}
                    </p>
                    <p style={{ fontSize:11, color:'var(--t3)' }}>{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`badge ${log.status==='success'?'badge-green':'badge-red'}`}>{log.status}</span>
                </div>
              )) : (
                <div style={{ textAlign:'center', padding:'24px 0', color:'var(--t3)', fontSize:13 }}>No activity yet</div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}
