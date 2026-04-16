import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'

import Login from './pages/Login'
import Layout from './components/common/Layout'
import Dashboard from './pages/Dashboard'
import POSCashier from './pages/POSCashier'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import Returns from './pages/Returns'
import Reports from './pages/Reports'
import DayEnd from './pages/DayEnd'
import Expenses from './pages/Expenses'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Backup from './pages/Backup'

function PrivateRoute({ children, roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POSCashier />} />
          <Route path="products" element={<PrivateRoute roles={['admin','manager']}><Products /></PrivateRoute>} />
          <Route path="inventory" element={<PrivateRoute roles={['admin','manager']}><Inventory /></PrivateRoute>} />
          <Route path="suppliers" element={<PrivateRoute roles={['admin','manager']}><Suppliers /></PrivateRoute>} />
          <Route path="customers" element={<Customers />} />
          <Route path="returns" element={<PrivateRoute roles={['admin','manager']}><Returns /></PrivateRoute>} />
          <Route path="reports" element={<PrivateRoute roles={['admin','manager']}><Reports /></PrivateRoute>} />
          <Route path="dayend" element={<PrivateRoute roles={['admin','manager']}><DayEnd /></PrivateRoute>} />
          <Route path="expenses" element={<PrivateRoute roles={['admin','manager']}><Expenses /></PrivateRoute>} />
          <Route path="users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute roles={['admin']}><Settings /></PrivateRoute>} />
          <Route path="backup" element={<PrivateRoute roles={['admin']}><Backup /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
