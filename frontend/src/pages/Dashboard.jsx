import { useState, useEffect } from 'react'
import { getDailySales, getLowStockAlerts, getProfitMargin } from '../api/api'
import { useAuthStore } from '../store'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 600, color: color || 'var(--color-text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [profit, setProfit] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    getDailySales(today).then(r => setStats(r.data)).catch(() => {})
    getProfitMargin(today, today).then(r => setProfit(r.data)).catch(() => {})
    getLowStockAlerts().then(r => setLowStock(r.data)).catch(() => {})
  }, [])

  const weekData = [
    { day: 'Mon', sales: 1240 }, { day: 'Tue', sales: 1890 },
    { day: 'Wed', sales: 1560 }, { day: 'Thu', sales: 2100 },
    { day: 'Fri', sales: 2800 }, { day: 'Sat', sales: 3200 },
    { day: 'Sun', sales: stats?.total_revenue || 0 },
  ]

  return (
    <div style={{ padding: 'var(--space-3xl)', fontFamily: 'var(--font-sans)', background: 'var(--color-background-tertiary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name}</h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' }}>{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)' }}>
        <StatCard label="Today's revenue" value={`$${(stats?.total_revenue || 0).toFixed(2)}`} sub={`${stats?.total_transactions || 0} transactions`} color="var(--color-accent)" />
        <StatCard label="Net profit" value={`$${(profit?.net_profit || 0).toFixed(2)}`} sub={`Margin: ${(profit?.margin_pct || 0).toFixed(1)}%`} color="var(--color-text-success)" />
        <StatCard label="Tax collected" value={`$${(stats?.total_tax || 0).toFixed(2)}`} sub="GST today" />
        <StatCard label="Low stock alerts" value={lowStock.length} sub="Items need restocking" color={lowStock.length > 0 ? 'var(--color-text-warning)' : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Weekly chart */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Weekly sales</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`$${v}`, 'Sales']} />
              <Bar dataKey="sales" fill="#378ADD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment breakdown */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Payment methods</div>
          {[
            { label: 'Cash', value: stats?.cash_sales || 0, color: '#1D9E75' },
            { label: 'Card', value: stats?.card_sales || 0, color: '#378ADD' },
            { label: 'QR / PayNow', value: stats?.qr_sales || 0, color: '#7F77DD' },
          ].map(p => {
            const total = (stats?.total_revenue || 1)
            const pct = Math.round((p.value / total) * 100)
            return (
              <div key={p.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{p.label}</span>
                  <span style={{ fontWeight: 500 }}>${p.value.toFixed(2)}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-background-secondary)', borderRadius: '3px' }}>
                  <div style={{ height: '6px', width: `${pct}%`, background: p.color, borderRadius: '3px' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Low stock table */}
      {lowStock.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-warning)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--color-text-warning)' }}>Low stock alerts ({lowStock.length})</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                {['Product', 'Current stock', 'Threshold', 'Status'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStock.slice(0, 8).map(p => (
                <tr key={p.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '8px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '8px', color: 'var(--color-text-danger)' }}>{p.stock_qty}</td>
                  <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>{p.low_stock_threshold}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}>
                      {p.stock_qty === 0 ? 'Out of stock' : 'Low stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
