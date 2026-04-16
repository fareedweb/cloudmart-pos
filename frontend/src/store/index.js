import { create } from 'zustand'

// ── Auth Store ────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('cloudmart_user') || 'null'),
  token: localStorage.getItem('cloudmart_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('cloudmart_token', token)
    localStorage.setItem('cloudmart_user', JSON.stringify(user))
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('cloudmart_token')
    localStorage.removeItem('cloudmart_user')
    set({ user: null, token: null })
  },

  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('cloudmart_user') || 'null')
    return user?.role === 'admin'
  },

  isManager: () => {
    const user = JSON.parse(localStorage.getItem('cloudmart_user') || 'null')
    return ['admin', 'manager'].includes(user?.role)
  },
}))

// ── Cart Store ────────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  heldSales: [],

  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.product_id === product.id)
    if (existing) {
      set({ items: items.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_price } : i) })
    } else {
      set({ items: [...items, { product_id: product.id, name: product.name, unit_price: product.selling_price, quantity: 1, discount_pct: 0, tax_rate: product.tax_rate || 0, line_total: product.selling_price }] })
    }
  },

  removeItem: (product_id) => set({ items: get().items.filter((i) => i.product_id !== product_id) }),

  updateQty: (product_id, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.product_id !== product_id) })
    } else {
      set({ items: get().items.map((i) => i.product_id === product_id ? { ...i, quantity, line_total: quantity * i.unit_price * (1 - i.discount_pct / 100) } : i) })
    }
  },

  updateItemDiscount: (product_id, discount_pct) => {
    set({ items: get().items.map((i) => i.product_id === product_id ? { ...i, discount_pct, line_total: i.quantity * i.unit_price * (1 - discount_pct / 100) } : i) })
  },

  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.line_total, 0),
  getTax: () => get().items.reduce((sum, i) => sum + (i.line_total * i.tax_rate / 100), 0),
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const tax = get().getTax()
    const discount = get().discount
    return subtotal + tax - discount
  },

  clearCart: () => set({ items: [], customer: null, discount: 0 }),

  holdCart: (name) => {
    const { items, customer, discount, heldSales } = get()
    if (items.length === 0) return
    set({ heldSales: [...heldSales, { id: Date.now(), name: name || `Hold ${heldSales.length + 1}`, items, customer, discount }], items: [], customer: null, discount: 0 })
  },

  resumeHeld: (id) => {
    const { heldSales } = get()
    const held = heldSales.find((h) => h.id === id)
    if (held) {
      set({ items: held.items, customer: held.customer, discount: held.discount, heldSales: heldSales.filter((h) => h.id !== id) })
    }
  },

  removeHeld: (id) => set({ heldSales: get().heldSales.filter((h) => h.id !== id) }),
}))

// ── Settings Store ────────────────────────────────────────────
export const useSettingsStore = create((set) => ({
  settings: { store_name: 'CloudMart Supermart', currency_symbol: '$', tax_rate: '9', tax_name: 'GST' },
  setSettings: (settings) => set({ settings }),
}))
