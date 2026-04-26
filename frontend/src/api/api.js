import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? 'https://cloudmart-pos-backend.onrender.com/api' : 'http://localhost:8000/api'),
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudmart_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cloudmart_token')
      localStorage.removeItem('cloudmart_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (data) => {
  const params = new URLSearchParams()
  params.append('username', data.username)
  params.append('password', data.password)
  return API.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}
export const logout = () => API.post('/auth/logout')
export const getMe = () => API.get('/auth/me')
export const resetPassword = (data) => API.post('/auth/reset-password', data)

// Users
export const getUsers = () => API.get('/users')
export const createUser = (data) => API.post('/users', data)
export const updateUser = (id, data) => API.put(`/users/${id}`, data)
export const getActivityLogs = () => API.get('/users/activity-logs')

// Products
export const getProducts = (params) => API.get('/products', { params })
export const getProductByBarcode = (barcode) => API.get(`/products/barcode/${barcode}`)
export const getProduct = (id) => API.get(`/products/${id}`)
export const createProduct = (data) => API.post('/products', data)
export const updateProduct = (id, data) => API.put(`/products/${id}`, data)
export const deleteProduct = (id) => API.delete(`/products/${id}`)

// Categories
export const getCategories = () => API.get('/categories')
export const createCategory = (data) => API.post('/categories', data)
export const deleteCategory = (id) => API.delete(`/categories/${id}`)

// Inventory
export const adjustStock = (data) => API.post('/inventory/adjust', data)
export const getStockMovements = (product_id) => API.get('/inventory/movements', { params: { product_id } })
export const getLowStockAlerts = () => API.get('/inventory/low-stock')

// Suppliers
export const getSuppliers = () => API.get('/suppliers')
export const createSupplier = (data) => API.post('/suppliers', data)
export const updateSupplier = (id, data) => API.put(`/suppliers/${id}`, data)
export const createPurchaseOrder = (data) => API.post('/suppliers/purchase-orders', data)
export const getPurchaseOrders = (supplier_id) => API.get('/suppliers/purchase-orders', { params: { supplier_id } })

// Sales
export const createSale = (data) => API.post('/sales', data)
export const getSales = (params) => API.get('/sales', { params })
export const getSale = (id) => API.get(`/sales/${id}`)
export const holdSale = (id) => API.post(`/sales/${id}/hold`)
export const voidSale = (id) => API.post(`/sales/${id}/void`)

// Customers
export const getCustomers = () => API.get('/customers')
export const createCustomer = (data) => API.post('/customers', data)
export const getCustomer = (id) => API.get(`/customers/${id}`)

// Returns
export const createReturn = (data) => API.post('/returns', data)
export const getReturns = () => API.get('/returns')

// Reports
export const getDailySales = (date) => API.get('/reports/daily-sales', { params: { report_date: date } })
export const getProductSales = (start, end) => API.get('/reports/product-sales', { params: { start, end } })
export const getCategorySales = (start, end) => API.get('/reports/category-sales', { params: { start, end } })
export const getCashierPerformance = (start, end) => API.get('/reports/cashier-performance', { params: { start, end } })
export const getProfitMargin = (start, end) => API.get('/reports/profit-margin', { params: { start, end } })
export const getInventoryValuation = () => API.get('/reports/inventory-valuation')
export const getTaxReport = (start, end) => API.get('/reports/tax-report', { params: { start, end } })

// Day End
export const closeDay = (data) => API.post('/dayend', data)
export const getDayEndRecords = () => API.get('/dayend')

// Expenses
export const getExpenses = (params) => API.get('/expenses', { params })
export const createExpense = (data) => API.post('/expenses', data)
export const deleteExpense = (id) => API.delete(`/expenses/${id}`)
export const getExpenseCategories = () => API.get('/expenses/categories')
export const createExpenseCategory = (data) => API.post('/expenses/categories', data)

// Settings
export const getSettings = () => API.get('/settings')
export const updateSetting = (data) => API.post('/settings', data)
export const updateSettingsBulk = (settings) => API.post('/settings/bulk', settings)

// Backup
export const triggerBackup = () => API.post('/backup/manual')
export const getAuditLogs = () => API.get('/backup/audit-logs')

export default API
