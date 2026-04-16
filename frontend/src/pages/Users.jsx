import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser, getActivityLogs } from '../api/api'
import toast from 'react-hot-toast'

export default function Users() {
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('users')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', username:'', password:'', role:'cashier' })

  useEffect(() => {
    getUsers().then(r=>setUsers(r.data)).catch(()=>{})
    getActivityLogs().then(r=>setLogs(r.data)).catch(()=>{})
  }, [])

  const handleSave = async () => {
    if (!form.name||!form.username||!form.password) return toast.error('Fill required fields')
    try { await createUser(form); toast.success('User created'); setShowModal(false); getUsers().then(r=>setUsers(r.data)) }
    catch (err) { toast.error(err.response?.data?.detail||'Failed') }
  }

  const toggleActive = async (u) => {
    await updateUser(u.id, { is_active: !u.is_active })
    toast.success(u.is_active ? 'User deactivated' : 'User activated')
    getUsers().then(r=>setUsers(r.data))
  }

  const roleColors = { admin:'var(--color-background-danger)', manager:'var(--color-background-warning)', cashier:'var(--color-background-info)' }
  const roleTextColors = { admin:'var(--color-text-danger)', manager:'var(--color-text-warning)', cashier:'var(--color-text-info)' }

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:500 }}>Users & Access</h1>
        <button onClick={()=>setShowModal(true)} style={{ padding:'8px 16px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, fontSize:'13px' }}>+ Add user</button>
      </div>
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {[['users','Users'],['logs','Activity logs']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'6px 14px', border:`0.5px solid ${tab===k?'#378ADD':'var(--color-border-tertiary)'}`, borderRadius:'8px', background:tab===k?'var(--color-background-info)':'none', color:tab===k?'var(--color-text-info)':'var(--color-text-secondary)', cursor:'pointer', fontSize:'13px' }}>{l}</button>
        ))}
      </div>
      <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', overflow:'hidden' }}>
        {tab==='users' ? (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['Name','Username','Email','Role','Status',''].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{users.map(u=>(
              <tr key={u.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{u.name}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{u.username}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{u.email}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:roleColors[u.role], color:roleTextColors[u.role] }}>{u.role}</span></td>
                <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:u.is_active?'var(--color-background-success)':'var(--color-background-secondary)', color:u.is_active?'var(--color-text-success)':'var(--color-text-secondary)' }}>{u.is_active?'Active':'Inactive'}</span></td>
                <td style={{ padding:'10px 14px' }}><button onClick={()=>toggleActive(u)} style={{ fontSize:'12px', padding:'4px 10px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'6px', cursor:'pointer', background:'none', color:'var(--color-text-secondary)' }}>{u.is_active?'Deactivate':'Activate'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>{['User','Action','Module','Details','Time'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--color-text-secondary)' }}>{h}</th>)}</tr></thead>
            <tbody>{logs.map(l=>(
              <tr key={l.id} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{l.user||'system'}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'var(--color-background-secondary)', color:'var(--color-text-secondary)' }}>{l.action}</span></td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{l.module}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.details||'—'}</td>
                <td style={{ padding:'10px 14px', color:'var(--color-text-tertiary)' }}>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'var(--color-background-primary)', borderRadius:'16px', padding:'28px', width:'400px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:500, marginBottom:'20px' }}>Add User</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['name','Full name *'],['username','Username *'],['email','Email'],['password','Password *']].map(([k,l])=>(
                <div key={k}><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>{l}</label><input type={k==='password'?'password':'text'} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%' }} /></div>
              ))}
              <div><label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Role</label>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{ width:'100%' }}>
                  {['admin','manager','cashier'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'20px' }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:'10px', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'8px', cursor:'pointer', background:'none', fontSize:'13px' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex:2, padding:'10px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', fontWeight:500, cursor:'pointer', fontSize:'13px' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
