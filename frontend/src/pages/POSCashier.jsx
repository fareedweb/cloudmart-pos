import { useState, useEffect, useRef } from 'react'
import { useCartStore, useAuthStore } from '../store'
import { getProducts, getProductByBarcode, createSale, getCustomers } from '../api/api'
import toast from 'react-hot-toast'
import Receipt from '../components/pos/Receipt'

export default function POSCashier() {
  const { user } = useAuthStore()
  const cart = useCartStore()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [customers, setCustomers] = useState([])
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [payMethod, setPayMethod] = useState('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [loading, setLoading] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const barcodeRef = useRef()

  useEffect(() => {
    loadProducts()
    getCustomers().then(r => setCustomers(r.data)).catch(() => {})
  }, [])

  const loadProducts = async () => {
    const res = await getProducts({ search: search || undefined })
    setProducts(res.data)
    const cats = [...new Set(res.data.map(p => p.category_id).filter(Boolean))]
    setCategories(cats)
  }

  useEffect(() => {
    const t = setTimeout(loadProducts, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleBarcodeScan = async (e) => {
    if (e.key === 'Enter' && e.target.value) {
      try {
        const res = await getProductByBarcode(e.target.value)
        cart.addItem(res.data)
        e.target.value = ''
        toast.success(`Added: ${res.data.name}`)
      } catch {
        toast.error('Product not found')
      }
    }
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) return toast.error('Cart is empty')
    if (payMethod === 'cash' && cashGiven && parseFloat(cashGiven) < cart.getTotal()) {
      return toast.error('Cash given is less than total')
    }
    setLoading(true)
    try {
      const saleData = {
        customer_id: cart.customer?.id || null,
        items: cart.items.map(i => ({ 
          product_id: i.product_id, 
          quantity: i.quantity, 
          unit_price: i.unit_price, 
          discount_pct: i.discount_pct || 0, 
          tax_rate: i.tax_rate || 0 
        })),
        discount_amount: cart.discount || 0,
        payment_method: payMethod,
        cash_given: cashGiven ? parseFloat(cashGiven) : null,
      }
      console.log('Sale data:', saleData)
      const res = await createSale(saleData)
      console.log('Sale response:', res.data)
      setLastSale({ ...res.data, items: cart.items, customer: cart.customer })
      cart.clearCart()
      setShowPayment(false)
      setShowReceipt(true)
      setCashGiven('')
      toast.success(`Sale complete — Invoice ${res.data.invoice_number}`)
    } catch (err) {
      console.error('Sale error:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Sale failed'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => activeCategory === 'all' || p.category_id === activeCategory)
  const subtotal = cart.getSubtotal()
  const tax = cart.getTax()
  const total = cart.getTotal()
  const change = cashGiven ? parseFloat(cashGiven) - total : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: '100vh', fontFamily: 'var(--font-sans)', background: 'var(--color-background-tertiary)' }}>
      {/* Left: Products */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-lg)', gap: 'var(--space-sm)', overflow: 'hidden', background: 'var(--color-background-primary)' }}>
        {/* Search & barcode */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <input ref={barcodeRef} placeholder="Scan barcode..." onKeyDown={handleBarcodeScan} style={{ width: '180px' }} />
        </div>

        {/* Held sales */}
        {cart.heldSales.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {cart.heldSales.map(h => (
              <button key={h.id} onClick={() => cart.resumeHeld(h.id)} style={{ padding: '4px 10px', fontSize: '12px', border: '0.5px solid var(--color-border-warning)', borderRadius: '8px', background: 'var(--color-background-warning)', color: 'var(--color-text-warning)', cursor: 'pointer' }}>
                Resume: {h.name}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', alignContent: 'start' }}>
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => { if (p.stock_qty > 0) { cart.addItem(p); toast.success(`Added ${p.name}`, { duration: 1000 }) } else toast.error('Out of stock') }}
              style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '12px', cursor: p.stock_qty > 0 ? 'pointer' : 'not-allowed', opacity: p.stock_qty === 0 ? 0.5 : 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>#{p.barcode || p.id}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-info)' }}>${p.selling_price.toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: p.stock_qty <= p.low_stock_threshold ? 'var(--color-text-warning)' : 'var(--color-text-tertiary)', marginTop: '4px' }}>Stock: {p.stock_qty}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ background: 'var(--color-background-primary)', borderLeft: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
        {/* Cart header */}
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 500, fontSize: '15px' }}>Cart ({cart.items.length})</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => cart.holdCart()} style={{ fontSize: '12px', padding: '4px 10px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '6px', cursor: 'pointer', background: 'none', color: 'var(--color-text-secondary)' }}>Hold</button>
            <button onClick={() => cart.clearCart()} style={{ fontSize: '12px', padding: '4px 10px', border: '0.5px solid var(--color-border-danger)', borderRadius: '6px', cursor: 'pointer', background: 'none', color: 'var(--color-text-danger)' }}>Clear</button>
          </div>
        </div>

        {/* Customer */}
        <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <select onChange={e => { const c = customers.find(c => c.id === parseInt(e.target.value)); cart.setCustomer(c || null) }} style={{ width: '100%', fontSize: '13px' }}>
            <option value="">Walk-in customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
          </select>
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px', marginTop: '40px' }}>Add products to cart</div>
          ) : cart.items.map(item => (
            <div key={item.product_id} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, flex: 1, marginRight: '8px' }}>{item.name}</div>
                <button onClick={() => cart.removeItem(item.product_id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-danger)', fontSize: '14px' }}>×</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => cart.updateQty(item.product_id, item.quantity - 1)} style={{ width: '24px', height: '24px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '6px', cursor: 'pointer', background: 'var(--color-background-secondary)', fontSize: '14px' }}>-</button>
                  <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => cart.updateQty(item.product_id, item.quantity + 1)} style={{ width: '24px', height: '24px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '6px', cursor: 'pointer', background: 'var(--color-background-secondary)', fontSize: '14px' }}>+</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" placeholder="Disc%" value={item.discount_pct || ''} min="0" max="100"
                    onChange={e => cart.updateItemDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                    style={{ width: '56px', fontSize: '12px', padding: '4px 6px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '60px', textAlign: 'right' }}>${item.line_total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & checkout */}
        <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input type="number" placeholder="Bill discount $" value={discountInput} min="0"
              onChange={e => { setDiscountInput(e.target.value); cart.setDiscount(parseFloat(e.target.value) || 0) }}
              style={{ flex: 1, fontSize: '13px' }} />
          </div>
          {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Tax (GST)', `$${tax.toFixed(2)}`], ['Discount', `-$${cart.discount.toFixed(2)}`]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 500, margin: '8px 0 12px', paddingTop: '8px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
          <button onClick={() => setShowPayment(true)} disabled={cart.items.length === 0}
            style={{ width: '100%', padding: '12px', background: '#185FA5', color: '#E6F1FB', border: 'none', borderRadius: '8px', fontWeight: 500, fontSize: '15px', cursor: 'pointer' }}>
            Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: '16px', padding: '28px', width: '360px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '20px' }}>Payment — ${total.toFixed(2)}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {['cash', 'card', 'qr'].map(m => (
                <button key={m} onClick={() => setPayMethod(m)}
                  style={{ padding: '10px', border: `0.5px solid ${payMethod === m ? '#378ADD' : 'var(--color-border-tertiary)'}`, borderRadius: '8px', background: payMethod === m ? 'var(--color-background-info)' : 'transparent', color: payMethod === m ? 'var(--color-text-info)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: payMethod === m ? 500 : 400, fontSize: '13px', textTransform: 'capitalize' }}>
                  {m === 'qr' ? 'QR/PayNow' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            {payMethod === 'cash' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Cash given</label>
                <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="0.00" style={{ width: '100%' }} autoFocus />
                {cashGiven && parseFloat(cashGiven) >= total && (
                  <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-success)' }}>Change: ${change.toFixed(2)}</div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowPayment(false)} style={{ flex: 1, padding: '10px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: 'pointer', background: 'none', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleCheckout} disabled={loading}
                style={{ flex: 2, padding: '10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt sale={lastSale} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  )
}
