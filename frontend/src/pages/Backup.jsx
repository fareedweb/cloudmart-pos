import { useState, useEffect } from 'react'
import { triggerBackup, getAuditLogs } from '../api/api'
import toast from 'react-hot-toast'

export default function Backup() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { getAuditLogs().then(r=>setLogs(r.data)).catch(()=>{}) }, [])

  const handleBackup = async () => {
    setLoading(true)
    try { await triggerBackup(); toast.success('Backup initiated'); getAuditLogs().then(r=>setLogs(r.data)) }
    catch { toast.error('Backup failed') } finally { setLoading(false) }
  }

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <h1 style={{ fontSize:'20px', fontWeight:500, marginBottom:'20px' }}>Backup & Security</h1>
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'20px' }}>
        <div>
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', padding:'20px', marginBottom:'12px' }}>
            <div style={{ fontSize:'14px', fontWeight:500, marginBottom:'8px' }}>Manual backup</div>
            <div style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginBottom:'14px' }}>Trigger an immediate backup of all data to cloud storage.</div>
            <button onClick={handleBackup} disabled={loading} style={{ width:'100%', padding:'10px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', fontWeight:500, cursor:'pointer', fontSize:'13px' }}>{loading?'Running...':'Backup now'}</button>
          </div>
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', padding:'20px' }}>
            <div style={{ fontSize:'14px', fontWeight:500, marginBottom:'12px' }}>Backup status</div>
            {[['Schedule','Daily auto'],['Storage','Supabase cloud'],['Retention','30 days'],['Last backup','On demand']].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'8px' }}>
                <span style={{ color:'var(--color-text-secondary)' }}>{l}</span><span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:'15px', fontWeight:500 }}>Audit logs</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['User','Action','Module','Details','Timestamp'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{logs.map(l=>(
              <tr key={l.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{l.user}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'var(--color-background-secondary)', color:'var(--color-text-secondary)' }}>{l.action}</span></td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{l.module}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)', maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.details||'—'}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)' }}>{new Date(l.timestamp).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
