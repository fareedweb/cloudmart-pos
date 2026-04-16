import { useState, useEffect } from 'react'
import { getSettings, updateSettingsBulk } from '../api/api'
import { useSettingsStore } from '../store'
import toast from 'react-hot-toast'

export default function Settings() {
  const [form, setForm] = useState({})
  const { setSettings } = useSettingsStore()

  useEffect(() => { getSettings().then(r=>setForm(r.data)).catch(()=>{}) }, [])

  const handleSave = async () => {
    try {
      const settings = Object.entries(form).map(([key,value])=>({ key, value: String(value) }))
      await updateSettingsBulk(settings)
      setSettings(form)
      toast.success('Settings saved')
    } catch (err) { toast.error('Failed to save') }
  }

  const fields = [
    { section:'Store info', items:[['store_name','Store name'],['store_address','Address'],['store_phone','Phone'],['store_email','Email']] },
    { section:'Financial', items:[['currency','Currency'],['currency_symbol','Currency symbol'],['tax_rate','Tax rate %'],['tax_name','Tax name (e.g. GST)']] },
    { section:'Receipt', items:[['receipt_footer','Receipt footer text'],['loyalty_rate','Loyalty: $ per point']] },
    { section:'System', items:[['printer_type','Printer type'],['backup_schedule','Backup schedule']] },
  ]

  return (
    <div style={{ padding:'24px', fontFamily:'var(--font-sans)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:500 }}>Settings</h1>
        <button onClick={handleSave} style={{ padding:'8px 20px', background:'#185FA5', color:'#E6F1FB', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, fontSize:'13px' }}>Save settings</button>
      </div>
      
      {/* Email Configuration Notice */}
      <div style={{ marginBottom:'20px', padding:'16px', background:'#dbeafe', border:'1px solid #0EA5E9', borderRadius:'8px' }}>
        <div style={{ fontSize:'14px', fontWeight:500, color:'#0369A1', marginBottom:'8px' }}>✉ Email Configuration for Day-End Reports</div>
        <p style={{ fontSize:'13px', color:'#0369A1', marginBottom:'8px' }}>
          To receive automatic email reports when you close the day, configure SMTP settings in the backend .env file:
        </p>
        <ul style={{ fontSize:'12px', color:'#0369A1', marginLeft:'20px', marginBottom:'8px' }}>
          <li>SMTP_EMAIL - Your email address (e.g., your-email@gmail.com)</li>
          <li>SMTP_PASSWORD - Your app password (not your regular password)</li>
          <li>SMTP_HOST - SMTP server (default: smtp.gmail.com)</li>
          <li>SMTP_PORT - Port number (default: 587)</li>
        </ul>
        <p style={{ fontSize:'12px', color:'#0369A1' }}>
          📖 <strong>Gmail Users:</strong> Generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" style={{color:'#0369A1'}}>myaccount.google.com/apppasswords</a>
        </p>
      </div>

      {fields.map(group => (
        <div key={group.section} style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'12px', padding:'20px', marginBottom:'16px' }}>
          <div style={{ fontSize:'14px', fontWeight:500, marginBottom:'16px', paddingBottom:'10px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>{group.section}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {group.items.map(([k,l])=>(
              <div key={k}>
                <label style={{ fontSize:'12px', color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>{l}</label>
                <input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
