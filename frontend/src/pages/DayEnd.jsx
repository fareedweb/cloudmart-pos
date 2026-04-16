import { useState, useEffect } from 'react'
import { closeDay, getDayEndRecords } from '../api/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DayEnd() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ date: format(new Date(),'yyyy-MM-dd'), opening_cash:'', closing_cash_physical:'', notes:'' })
  const [result, setResult] = useState(null)

  useEffect(() => { getDayEndRecords().then(r=>setRecords(r.data)).catch(()=>{}) }, [])

  const handleClose = async () => {
    if (!form.closing_cash_physical) return toast.error('Enter closing cash')
    try {
      const res = await closeDay({ ...form, opening_cash: parseFloat(form.opening_cash)||0, closing_cash_physical: parseFloat(form.closing_cash_physical) })
      setResult(res.data)
      toast.success('Day closed successfully')
      getDayEndRecords().then(r=>setRecords(r.data))
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <h1 style={{ fontSize:'20px', fontWeight:500, marginBottom:'20px' }}>Day-End Closing</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', padding:'20px' }}>
          <div style={{ fontSize:'15px', fontWeight:500, marginBottom:'16px' }}>Close today</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[['date','Date','date'],['opening_cash','Opening cash','number'],['closing_cash_physical','Physical closing cash','number'],['notes','Notes','text']].map(([k,l,t])=>(
              <div key={k}><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%' }} />
              </div>
            ))}
          </div>
          <button onClick={handleClose} style={{ width:'100%', marginTop:'16px', padding:'12px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', fontWeight:500, fontSize:'14px', cursor:'pointer' }}>Close Day</button>

          {result && (
            <div style={{ marginTop:'16px', padding:'16px', background:'var(--color-background-success)', borderRadius:'8px' }}>
              <div style={{ fontSize:'13px', fontWeight:500, color:'var(--color-text-success)', marginBottom:'8px' }}>✓ Day closed successfully</div>
              {[['Total sales',`$${result.total_sales?.toFixed(2)}`],['Net profit',`$${result.net_profit?.toFixed(2)}`],['Transactions',result.transactions]].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px' }}><span style={{ color:'var(--color-text-secondary)' }}>{l}</span><span style={{ fontWeight:500 }}>{v}</span></div>
              ))}
              {result.email_sent && (
                <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid rgba(22, 101, 52, 0.3)', fontSize:'12px', color:'var(--color-text-success)' }}>
                  ✉ Report email sent to: {result.email || 'Admin'}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:'15px', fontWeight:500 }}>History</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['Date','Sales','Returns','Expenses','Net profit','Cash diff'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{records.map(r=>(
              <tr key={r.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{r.date}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-info)' }}>${r.total_sales?.toFixed(2)}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-danger)' }}>${r.total_returns?.toFixed(2)}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-warning)' }}>${r.total_expenses?.toFixed(2)}</td>
                <td style={{ padding:'10px 14px', fontWeight:500, color:r.net_profit>=0?'var(--color-text-success)':'var(--color-text-danger)' }}>${r.net_profit?.toFixed(2)}</td>
                <td style={{ padding:'10px 14px', color:Math.abs(r.cash_difference)>10?'var(--color-text-danger)':'var(--color-text-success)' }}>${r.cash_difference?.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
