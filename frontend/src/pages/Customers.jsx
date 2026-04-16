import { useState, useEffect } from 'react'
import { getCustomers, createCustomer, getCustomer } from '../api/api'
import toast from 'react-hot-toast'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', email:'', discount_pct:0 })

  useEffect(() => { getCustomers().then(r=>setCustomers(r.data)).catch(()=>{}) }, [])

  const handleSelect = async (c) => {
    setSelected(c)
    const res = await getCustomer(c.id)
    setDetail(res.data)
  }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name required')
    try { await createCustomer(form); toast.success('Customer added'); setShowModal(false); getCustomers().then(r=>setCustomers(r.data)) }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', height:'100%', fontFamily:'var(--font-sans)' }}>
      <div style={{ padding:'24px', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:500 }}>Customers</h1>
          <button onClick={()=>setShowModal(true)} style={{ padding:'8px 16px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, fontSize:'13px' }}>+ Add customer</button>
        </div>
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['Name','Phone','Email','Loyalty pts','Credit','Discount'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{customers.map(c=>(
              <tr key={c.id} onClick={()=>handleSelect(c)} style={{ borderTop:'0.5px solid var(--color-border-tertiary)', cursor:'pointer', background:selected?.id===c.id?'var(--color-background-info)':'transparent' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{c.name}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{c.phone||'—'}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{c.email||'—'}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-info)' }}>{c.loyalty_points}</td>
                <td style={{ padding:'10px 14px', color:c.credit_balance>0?'var(--color-text-danger)':'var(--color-text-secondary)' }}>${c.credit_balance.toFixed(2)}</td>
                <td style={{ padding:'10px 14px' }}>{c.discount_pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={{ borderLeft:'0.5px solid var(--color-border-tertiary)', padding:'24px', background:'var(--color-background-primary)' }}>
        {detail ? (
          <div>
            <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'var(--color-background-info)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-info)', fontWeight:500, fontSize:'18px', marginBottom:'12px' }}>{detail.name?.charAt(0)}</div>
            <div style={{ fontSize:'18px', fontWeight:500 }}>{detail.name}</div>
            <div style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginTop:'2px' }}>{detail.phone} {detail.email}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', margin:'16px 0' }}>
              {[['Loyalty pts', detail.loyalty_points, 'var(--color-text-info)'],['Credit balance',`$${detail.credit_balance?.toFixed(2)}`, detail.credit_balance>0?'var(--color-text-danger)':'var(--color-text-success)'],['Discount',`${detail.discount_pct}%`,'var(--color-text-secondary)']].map(([l,v,c])=>(
                <div key={l} style={{ background:'var(--color-background-secondary)', borderRadius:'8px', padding:'10px' }}>
                  <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}>{l}</div>
                  <div style={{ fontSize:'16px', fontWeight:500, color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'8px' }}>Recent purchases</div>
            {detail.recent_sales?.map(s=>(
              <div key={s.invoice} style={{ display:'flex', justifyContent:'space-between', padding:'8px', background:'var(--color-background-secondary)', borderRadius:'8px', marginBottom:'4px', fontSize:'13px' }}>
                <span style={{ color:'var(--color-text-secondary)' }}>{s.invoice}</span>
                <span style={{ fontWeight:500 }}>${s.total?.toFixed(2)}</span>
              </div>
            ))}
            {!detail.recent_sales?.length && <div style={{ fontSize:'13px', color:'var(--color-text-tertiary)' }}>No purchases yet</div>}
          </div>
        ) : <div style={{ textAlign:'center', color:'var(--color-text-tertiary)', fontSize:'13px', marginTop:'60px' }}>Select a customer to view details</div>}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'var(--color-background-primary)', borderRadius:'16px', padding:'28px', width:'380px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:500, marginBottom:'20px' }}>Add Customer</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['name','Name *'],['phone','Phone'],['email','Email'],['discount_pct','Discount %']].map(([k,l])=>(
                <div key={k}><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>{l}</label><input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%' }} /></div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'20px' }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:'10px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'8px', cursor:'pointer', background:'none', fontSize:'13px' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex:2, padding:'10px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', fontWeight:500, cursor:'pointer', fontSize:'13px' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
