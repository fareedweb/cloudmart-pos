import { useState, useEffect } from 'react'
import { getExpenses, createExpense, deleteExpense, getExpenseCategories, createExpenseCategory } from '../api/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ category_id:'', description:'', amount:'', expense_date: format(new Date(),'yyyy-MM-dd') })
  const [newCat, setNewCat] = useState('')

  useEffect(() => {
    getExpenses().then(r=>setExpenses(r.data)).catch(()=>{})
    getExpenseCategories().then(r=>setCategories(r.data)).catch(()=>{})
  }, [])

  const handleSave = async () => {
    if (!form.category_id || !form.amount || !form.description) return toast.error('Fill all fields')
    try {
      await createExpense({ ...form, category_id:parseInt(form.category_id), amount:parseFloat(form.amount) })
      toast.success('Expense added')
      setShowModal(false)
      getExpenses().then(r=>setExpenses(r.data))
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleAddCat = async () => {
    if (!newCat) return
    await createExpenseCategory({ name:newCat })
    setNewCat('')
    getExpenseCategories().then(r=>setCategories(r.data))
  }

  const total = expenses.reduce((s,e)=>s+e.amount,0)

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:500 }}>Expenses</h1>
          <div style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginTop:'2px' }}>Total: <span style={{ fontWeight:500, color:'var(--color-text-danger)' }}>${total.toFixed(2)}</span></div>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ padding:'8px 16px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, fontSize:'13px' }}>+ Add expense</button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', alignItems:'center' }}>
        <input placeholder="New category..." value={newCat} onChange={e=>setNewCat(e.target.value)} style={{ width:'200px', fontSize:'13px' }} />
        <button onClick={handleAddCat} style={{ padding:'7px 12px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'8px', cursor:'pointer', background:'none', fontSize:'13px', color:'var(--color-text-secondary)' }}>Add category</button>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {categories.map(c=><span key={c.id} style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'10px', background:'var(--color-background-info)', color:'var(--color-text-info)' }}>{c.name}</span>)}
        </div>
      </div>

      <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['Category','Description','Amount','Date',''].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
          <tbody>{expenses.map(e=>(
            <tr key={e.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
              <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'var(--color-background-secondary)', color:'var(--color-text-secondary)' }}>{categories.find(c=>c.id===e.category_id)?.name||'—'}</span></td>
              <td style={{ padding:'10px 14px' }}>{e.description}</td>
              <td style={{ padding:'10px 14px', fontWeight:500, color:'var(--color-text-danger)' }}>${e.amount.toFixed(2)}</td>
              <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)' }}>{e.expense_date}</td>
              <td style={{ padding:'10px 14px' }}><button onClick={async()=>{await deleteExpense(e.id);getExpenses().then(r=>setExpenses(r.data))}} style={{ fontSize:'12px', padding:'3px 8px', border:'0.5px solid var(--color-border-danger)', borderRadius:'6px', cursor:'pointer', background:'none', color:'var(--color-text-danger)' }}>Delete</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'var(--color-background-primary)', borderRadius:'16px', padding:'28px', width:'380px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:500, marginBottom:'20px' }}>Add Expense</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Category</label>
                <select value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))} style={{ width:'100%' }}>
                  <option value="">Select</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {[['description','Description'],['amount','Amount'],['expense_date','Date']].map(([k,l])=>(
                <div key={k}><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>{l}</label><input type={k==='expense_date'?'date':k==='amount'?'number':'text'} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%' }} /></div>
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
