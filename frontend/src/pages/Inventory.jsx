// ── Inventory.jsx ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { getProducts, adjustStock, getLowStockAlerts, getStockMovements } from '../api/api'
import toast from 'react-hot-toast'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [movements, setMovements] = useState([])
  const [tab, setTab] = useState('all')
  const [showAdjust, setShowAdjust] = useState(false)
  const [form, setForm] = useState({ product_id: '', type: 'stock_in', quantity: '', note: '' })

  useEffect(() => {
    getProducts().then(r => setProducts(r.data)).catch(() => {})
    getLowStockAlerts().then(r => setLowStock(r.data)).catch(() => {})
    getStockMovements().then(r => setMovements(r.data)).catch(() => {})
  }, [])

  const handleAdjust = async () => {
    if (!form.product_id || !form.quantity) return toast.error('Select product and quantity')
    try {
      await adjustStock({ ...form, product_id: parseInt(form.product_id), quantity: parseFloat(form.quantity) })
      toast.success('Stock adjusted')
      setShowAdjust(false)
      getProducts().then(r => setProducts(r.data))
      getStockMovements().then(r => setMovements(r.data))
      getLowStockAlerts().then(r => setLowStock(r.data))
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const display = tab === 'low' ? lowStock : products

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500 }}>Inventory</h1>
        <button onClick={() => setShowAdjust(true)} style={{ padding: '8px 16px', background: '#185FA5', color: '#E6F1FB', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>Adjust Stock</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[['all', 'All products'], ['low', `Low stock (${lowStock.length})`], ['movements', 'Stock movements']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '6px 14px', border: `0.5px solid ${tab===k ? '#378ADD' : 'var(--color-border-tertiary)'}`, borderRadius: '8px', background: tab===k ? 'var(--color-background-info)' : 'none', color: tab===k ? 'var(--color-text-info)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px' }}>{l}</button>
        ))}
      </div>
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
        {tab === 'movements' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ background: 'var(--color-background-secondary)' }}>
              {['Product', 'Type', 'Quantity', 'Reference', 'Note', 'Date'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>)}
            </tr></thead>
            <tbody>{movements.map(m => (
              <tr key={m.id} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '10px 14px' }}>{products.find(p => p.id === m.product_id)?.name || m.product_id}</td>
                <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: m.type==='stock_in'?'var(--color-background-success)':m.type==='sale_out'?'var(--color-background-info)':'var(--color-background-warning)', color: m.type==='stock_in'?'var(--color-text-success)':m.type==='sale_out'?'var(--color-text-info)':'var(--color-text-warning)' }}>{m.type}</span></td>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{m.quantity}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{m.reference || '—'}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{m.note || '—'}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-tertiary)' }}>{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ background: 'var(--color-background-secondary)' }}>
              {['Product', 'Barcode', 'Stock', 'Threshold', 'Cost value', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>)}
            </tr></thead>
            <tbody>{display.map(p => (
              <tr key={p.id} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{p.barcode || '—'}</td>
                <td style={{ padding: '10px 14px', color: p.stock_qty <= p.low_stock_threshold ? 'var(--color-text-danger)' : 'var(--color-text-primary)', fontWeight: 500 }}>{p.stock_qty}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{p.low_stock_threshold}</td>
                <td style={{ padding: '10px 14px' }}>${(p.stock_qty * p.cost_price).toFixed(2)}</td>
                <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: p.stock_qty===0?'var(--color-background-danger)':p.stock_qty<=p.low_stock_threshold?'var(--color-background-warning)':'var(--color-background-success)', color: p.stock_qty===0?'var(--color-text-danger)':p.stock_qty<=p.low_stock_threshold?'var(--color-text-warning)':'var(--color-text-success)' }}>{p.stock_qty===0?'Out of stock':p.stock_qty<=p.low_stock_threshold?'Low stock':'In stock'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showAdjust && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: '16px', padding: '28px', width: '380px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '20px' }}>Adjust stock</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Product</label>
                <select value={form.product_id} onChange={e => setForm(f => ({...f, product_id: e.target.value}))} style={{ width: '100%' }}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty})</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} style={{ width: '100%' }}>
                  {['stock_in', 'stock_out', 'adjustment'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Quantity</label><input type="number" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Note</label><input value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} style={{ width: '100%' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setShowAdjust(false)} style={{ flex: 1, padding: '10px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: 'pointer', background: 'none', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleAdjust} style={{ flex: 2, padding: '10px', background: '#185FA5', color: '#E6F1FB', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}>Adjust</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
