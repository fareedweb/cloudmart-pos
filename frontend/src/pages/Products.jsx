import { useState, useEffect } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api/api'
import toast from 'react-hot-toast'

const empty = { name: '', barcode: '', sku: '', category_id: '', cost_price: '', selling_price: '', tax_rate: 9, stock_qty: 0, low_stock_threshold: 10, expiry_date: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  useEffect(() => { load() }, [search])
  useEffect(() => { getCategories().then(r => setCategories(r.data)).catch(() => {}) }, [])

  const load = () => getProducts({ search: search || undefined }).then(r => setProducts(r.data)).catch(() => {})

  const openCreate = () => { setForm(empty); setEditing(null); setShowModal(true) }
  const openEdit = (p) => { setForm({ ...p, expiry_date: p.expiry_date || '' }); setEditing(p.id); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.selling_price) return toast.error('Name and selling price required')
    try {
      const data = { 
        name: form.name.trim(),
        barcode: form.barcode?.trim() || null,
        sku: form.sku?.trim() || null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        brand_id: null,
        cost_price: parseFloat(form.cost_price) || 0,
        selling_price: parseFloat(form.selling_price),
        tax_rate: parseFloat(form.tax_rate) || 0,
        low_stock_threshold: parseFloat(form.low_stock_threshold) || 10,
        expiry_date: form.expiry_date || null
      }
      if (!editing) {
        data.stock_qty = parseFloat(form.stock_qty) || 0
      }
      console.log('Product data:', data)
      if (editing) {
        await updateProduct(editing, data)
        toast.success('Product updated')
      } else {
        await createProduct(data)
        toast.success('Product created')
      }
      setShowModal(false)
      load()
    } catch (err) { 
      console.error('Product save error:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to save product'
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    toast.success('Product deleted')
    load()
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500 }}>Products</h1>
        <button onClick={openCreate} style={{ padding: '8px 16px', background: '#185FA5', color: '#E6F1FB', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>+ Add product</button>
      </div>

      <input placeholder="Search by name or barcode..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '320px', marginBottom: '16px' }} />

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--color-background-secondary)' }}>
              {['Name', 'Barcode', 'Category', 'Cost', 'Price', 'Stock', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{p.barcode || '—'}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{categories.find(c => c.id === p.category_id)?.name || '—'}</td>
                <td style={{ padding: '10px 14px' }}>${p.cost_price.toFixed(2)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--color-text-info)' }}>${p.selling_price.toFixed(2)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ color: p.stock_qty <= p.low_stock_threshold ? 'var(--color-text-warning)' : 'var(--color-text-primary)' }}>{p.stock_qty}</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: p.is_active ? 'var(--color-background-success)' : 'var(--color-background-secondary)', color: p.is_active ? 'var(--color-text-success)' : 'var(--color-text-secondary)' }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(p)} style={{ fontSize: '12px', padding: '4px 10px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '6px', cursor: 'pointer', background: 'none', color: 'var(--color-text-secondary)' }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ fontSize: '12px', padding: '4px 10px', border: '0.5px solid var(--color-border-danger)', borderRadius: '6px', cursor: 'pointer', background: 'none', color: 'var(--color-text-danger)' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>No products found</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '20px' }}>{editing ? 'Edit product' : 'Add product'}</h3>
            {editing && form.stock_qty !== undefined && (
              <div style={{ background: 'var(--color-background-info)', border: '1px solid var(--color-text-info)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-info)' }}>
                📦 Current stock: <strong>{form.stock_qty}</strong> — To adjust stock, use the <strong>Inventory</strong> module
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(editing ? 
                [['name','Name *','text'],['barcode','Barcode','text'],['sku','SKU','text'],['selling_price','Selling price *','number'],['cost_price','Cost price','number'],['tax_rate','Tax rate %','number'],['low_stock_threshold','Low stock alert','number'],['expiry_date','Expiry date','date']]
                : [['name','Name *','text'],['barcode','Barcode','text'],['sku','SKU','text'],['selling_price','Selling price *','number'],['cost_price','Cost price','number'],['tax_rate','Tax rate %','number'],['stock_qty','Initial stock','number'],['low_stock_threshold','Low stock alert','number'],['expiry_date','Expiry date','date']]
              ).map(([key, label, type]) => (
                <div key={key} style={key === 'name' ? { gridColumn: 'span 2' } : {}}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input type={type} value={form[key] !== undefined && form[key] !== null ? form[key] : ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                <select value={form.category_id || ''} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={{ width: '100%' }}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: 'pointer', background: 'none', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 2, padding: '10px', background: '#185FA5', color: '#E6F1FB', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}>
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
