import { useState, useEffect } from 'react'
import { getReturns, createReturn, getSales, getProducts } from '../api/api'
import toast from 'react-hot-toast'

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [saleData, setSaleData] = useState(null)
  const [form, setForm] = useState({ return_type:'full', refund_method:'cash', reason:'', items:[] })

  useEffect(() => { getReturns().then(r=>setReturns(r.data)).catch(()=>{}) }, [])

  const searchSale = async () => {
    if (!invoiceSearch) return
    try {
      const res = await getSales({ search: invoiceSearch })
      const sale = res.data.find(s => s.invoice_number === invoiceSearch)
      if (!sale) return toast.error('Invoice not found')
      const detail = await import('../api/api').then(m => m.getSale(sale.id))
      setSaleData(detail.data)
      setForm(f => ({ ...f, sale_id: sale.id, items: detail.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, refund_amount: i.line_total, selected: true })) }))
    } catch { toast.error('Sale not found') }
  }

  const handleReturn = async () => {
    if (!form.sale_id) return toast.error('Search an invoice first')
    try {
      const items = form.items.filter(i => i.selected)
      await createReturn({ sale_id: form.sale_id, return_type: form.return_type, refund_method: form.refund_method, reason: form.reason, items })
      toast.success('Return processed')
      setShowModal(false)
      setSaleData(null)
      setInvoiceSearch('')
      getReturns().then(r=>setReturns(r.data))
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:500 }}>Returns & Refunds</h1>
        <button onClick={()=>setShowModal(true)} style={{ padding:'8px 16px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, fontSize:'13px' }}>Process Return</button>
      </div>
      <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['Sale ID','Type','Method','Refund amount','Reason','Date'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
          <tbody>{returns.map(r=>(
            <tr key={r.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
              <td style={{ padding:'10px 14px' }}>#{r.sale_id}</td>
              <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'var(--color-background-info)', color:'var(--color-text-info)' }}>{r.return_type}</span></td>
              <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{r.refund_method}</td>
              <td style={{ padding:'10px 14px', fontWeight:500, color:'var(--color-text-danger)' }}>${r.refund_amount?.toFixed(2)}</td>
              <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{r.reason||'—'}</td>
              <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
        {returns.length===0 && <div style={{ textAlign:'center', padding:'40px', color:'var(--color-text-tertiary)', fontSize:'13px' }}>No returns yet</div>}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'var(--color-background-primary)', borderRadius:'16px', padding:'28px', width:'480px', maxHeight:'85vh', overflowY:'auto' }}>
            <h3 style={{ fontSize:'16px', fontWeight:500, marginBottom:'20px' }}>Process Return</h3>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
              <input placeholder="Enter invoice number..." value={invoiceSearch} onChange={e=>setInvoiceSearch(e.target.value)} style={{ flex:1 }} />
              <button onClick={searchSale} style={{ padding:'8px 14px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>Search</button>
            </div>
            {saleData && (
              <div>
                <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'8px' }}>Items to return:</div>
                {form.items.map((item,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', background:'var(--color-background-secondary)', borderRadius:'8px', marginBottom:'6px', fontSize:'13px' }}>
                    <input type="checkbox" checked={item.selected} onChange={e=>{const items=[...form.items];items[i].selected=e.target.checked;setForm(f=>({...f,items}))}} />
                    <span style={{ flex:1 }}>Product #{item.product_id}</span>
                    <span>Qty: {item.quantity}</span>
                    <span style={{ fontWeight:500 }}>${item.refund_amount?.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'12px' }}>
                  <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Return type</label>
                    <select value={form.return_type} onChange={e=>setForm(f=>({...f,return_type:e.target.value}))} style={{ width:'100%' }}>
                      {['full','partial','exchange'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Refund method</label>
                    <select value={form.refund_method} onChange={e=>setForm(f=>({...f,refund_method:e.target.value}))} style={{ width:'100%' }}>
                      {['cash','card','credit'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:'10px' }}><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Reason</label><input value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{ width:'100%' }} /></div>
              </div>
            )}
            <div style={{ display:'flex', gap:'8px', marginTop:'20px' }}>
              <button onClick={()=>{setShowModal(false);setSaleData(null)}} style={{ flex:1, padding:'10px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'8px', cursor:'pointer', background:'none', fontSize:'13px' }}>Cancel</button>
              {saleData && <button onClick={handleReturn} style={{ flex:2, padding:'10px', background:'#D85A30', color:'#fff', border:'none', borderRadius:'8px', fontWeight:500, cursor:'pointer', fontSize:'13px' }}>Confirm Return</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
