import { useState, useEffect } from 'react'
import { getSuppliers, createSupplier, updateSupplier, getPurchaseOrders, createPurchaseOrder, getProducts } from '../api/api'
import toast from 'react-hot-toast'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [tab, setTab] = useState('suppliers')
  const [showModal, setShowModal] = useState(false)
  const [showPO, setShowPO] = useState(false)
  const [form, setForm] = useState({ name:'', contact_person:'', email:'', phone:'', address:'', credit_limit:0 })
  const [poForm, setPOForm] = useState({ supplier_id:'', items:[{ product_id:'', quantity:'', unit_cost:'' }] })

  useEffect(() => {
    getSuppliers().then(r=>setSuppliers(r.data)).catch(()=>{})
    getPurchaseOrders().then(r=>setOrders(r.data)).catch(()=>{})
    getProducts().then(r=>setProducts(r.data)).catch(()=>{})
  }, [])

  const handleSave = async () => {
    if (!form.name) return toast.error('Supplier name required')
    try { await createSupplier(form); toast.success('Supplier added'); setShowModal(false); getSuppliers().then(r=>setSuppliers(r.data)) }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handlePO = async () => {
    if (!poForm.supplier_id) return toast.error('Select supplier')
    try {
      const items = poForm.items.filter(i=>i.product_id&&i.quantity).map(i=>({ product_id:parseInt(i.product_id), quantity:parseFloat(i.quantity), unit_cost:parseFloat(i.unit_cost)||0 }))
      await createPurchaseOrder({ supplier_id:parseInt(poForm.supplier_id), items })
      toast.success('Purchase order created')
      setShowPO(false)
      getPurchaseOrders().then(r=>setOrders(r.data))
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:500 }}>Suppliers</h1>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={()=>setShowPO(true)} style={{ padding:'8px 14px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'8px', cursor:'pointer', background:'none', fontSize:'13px' }}>+ Purchase Order</button>
          <button onClick={()=>setShowModal(true)} style={{ padding:'8px 14px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, fontSize:'13px' }}>+ Add Supplier</button>
        </div>
      </div>
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[['suppliers','Suppliers'],['orders','Purchase orders']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'6px 14px', border:`0.5px solid ${tab===k?'#378ADD':'var(--color-border-tertiary)'}`, borderRadius:'8px', background:tab===k?'var(--color-background-info)':'none', color:tab===k?'var(--color-text-info)':'var(--color-text-secondary)', cursor:'pointer', fontSize:'13px' }}>{l}</button>
        ))}
      </div>
      <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
        {tab==='suppliers' ? (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['Name','Contact','Email','Phone','Balance','Credit limit'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{suppliers.map(s=>(
              <tr key={s.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{s.name}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{s.contact_person||'—'}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{s.email||'—'}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{s.phone||'—'}</td>
                <td style={{ padding:'10px 14px', color:s.balance>0?'var(--color-text-danger)':'var(--color-text-success)', fontWeight:500 }}>${s.balance.toFixed(2)}</td>
                <td style={{ padding:'10px 14px' }}>${s.credit_limit.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['PO Number','Supplier','Total','Paid','Status','Date'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{orders.map(o=>(
              <tr key={o.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{o.po_number}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{suppliers.find(s=>s.id===o.supplier_id)?.name||o.supplier_id}</td>
                <td style={{ padding:'10px 14px' }}>${o.total_amount.toFixed(2)}</td>
                <td style={{ padding:'10px 14px' }}>${o.paid_amount.toFixed(2)}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'var(--color-background-warning)', color:'var(--color-text-warning)' }}>{o.status}</span></td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)' }}>{new Date(o.ordered_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'var(--color-background-primary)', borderRadius:'16px', padding:'28px', width:'420px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:500, marginBottom:'20px' }}>Add Supplier</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['name','Name *'],['contact_person','Contact person'],['email','Email'],['phone','Phone'],['address','Address'],['credit_limit','Credit limit']].map(([k,l])=>(
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

      {showPO && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'var(--color-background-primary)', borderRadius:'16px', padding:'28px', width:'500px', maxHeight:'85vh', overflowY:'auto' }}>
            <h3 style={{ fontSize:'16px', fontWeight:500, marginBottom:'20px' }}>New Purchase Order</h3>
            <div style={{ marginBottom:'12px' }}><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Supplier</label>
              <select value={poForm.supplier_id} onChange={e=>setPOForm(f=>({...f,supplier_id:e.target.value}))} style={{ width:'100%' }}>
                <option value="">Select supplier</option>
                {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {poForm.items.map((item,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:'8px', marginBottom:'8px', alignItems:'end' }}>
                <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Product</label>
                  <select value={item.product_id} onChange={e=>{const items=[...poForm.items];items[i].product_id=e.target.value;const p=products.find(p=>p.id===parseInt(e.target.value));if(p)items[i].unit_cost=p.cost_price;setPOForm(f=>({...f,items}))}} style={{ width:'100%' }}>
                    <option value="">Select</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Qty</label><input type="number" value={item.quantity} onChange={e=>{const items=[...poForm.items];items[i].quantity=e.target.value;setPOForm(f=>({...f,items}))}} style={{ width:'100%' }} /></div>
                <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Cost</label><input type="number" value={item.unit_cost} onChange={e=>{const items=[...poForm.items];items[i].unit_cost=e.target.value;setPOForm(f=>({...f,items}))}} style={{ width:'100%' }} /></div>
                <button onClick={()=>setPOForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}))} style={{ padding:'4px 8px', border:'none', background:'none', cursor:'pointer', color:'var(--color-text-danger)', fontSize:'16px', marginTop:'14px' }}>×</button>
              </div>
            ))}
            <button onClick={()=>setPOForm(f=>({...f,items:[...f.items,{product_id:'',quantity:'',unit_cost:''}]}))} style={{ fontSize:'12px', color:'var(--color-text-info)', border:'none', background:'none', cursor:'pointer', marginBottom:'16px' }}>+ Add item</button>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={()=>setShowPO(false)} style={{ flex:1, padding:'10px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'8px', cursor:'pointer', background:'none', fontSize:'13px' }}>Cancel</button>
              <button onClick={handlePO} style={{ flex:2, padding:'10px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', fontWeight:500, cursor:'pointer', fontSize:'13px' }}>Create PO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
