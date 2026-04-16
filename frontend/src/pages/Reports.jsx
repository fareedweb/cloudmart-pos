import { useState, useEffect } from 'react'
import { getDailySales, getProductSales, getCategorySales, getProfitMargin, getCashierPerformance, getTaxReport, getInventoryValuation } from '../api/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format } from 'date-fns'

const COLORS = ['#378ADD', '#1D9E75', '#7F77DD', '#D85A30', '#BA7517']

export default function Reports() {
  const [tab, setTab] = useState('daily')
  const [start, setStart] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [end, setEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchReport() }, [tab, start, end])

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'daily') res = await getDailySales(start)
      else if (tab === 'products') res = await getProductSales(start, end)
      else if (tab === 'categories') res = await getCategorySales(start, end)
      else if (tab === 'profit') res = await getProfitMargin(start, end)
      else if (tab === 'cashiers') res = await getCashierPerformance(start, end)
      else if (tab === 'tax') res = await getTaxReport(start, end)
      else if (tab === 'inventory') res = await getInventoryValuation()
      setData(res?.data)
    } catch { setData(null) } finally { setLoading(false) }
  }

  const tabs = [['daily','Daily sales'],['products','Product sales'],['categories','Category sales'],['profit','Profit & margin'],['cashiers','Cashier performance'],['tax','Tax report'],['inventory','Inventory valuation']]

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500 }}>Reports & Analytics</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {tab !== 'inventory' && <>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ fontSize: '13px' }} />
            {tab !== 'daily' && <><span style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>to</span><input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ fontSize: '13px' }} /></>}
          </>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '6px 14px', border: `0.5px solid ${tab===k?'#378ADD':'var(--color-border-tertiary)'}`, borderRadius: '8px', background: tab===k?'var(--color-background-info)':'none', color: tab===k?'var(--color-text-info)':'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px' }}>{l}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Loading...</div>}

      {!loading && data && (
        <>
          {/* Daily sales */}
          {tab === 'daily' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                {[['Total revenue', `$${data.total_revenue?.toFixed(2)}`], ['Transactions', data.total_transactions], ['Tax collected', `$${data.total_tax?.toFixed(2)}`], ['Discounts', `$${data.total_discount?.toFixed(2)}`]].map(([l, v]) => (
                  <div key={l} style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>{l}</div>
                    <div style={{ fontSize: '22px', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>Payment breakdown</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{ name: 'Cash', value: data.cash_sales }, { name: 'Card', value: data.card_sales }, { name: 'QR', value: data.qr_sales }]}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={v => [`$${v}`, 'Sales']} />
                    <Bar dataKey="value" fill="#378ADD" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Product sales */}
          {tab === 'products' && Array.isArray(data) && (
            <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ background: 'var(--color-background-secondary)' }}>
                  {['Product','Qty sold','Revenue','Cost','Profit'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>)}
                </tr></thead>
                <tbody>{data.sort((a,b)=>b.revenue-a.revenue).map(p => (
                  <tr key={p.id} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 14px' }}>{p.qty_sold}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-info)' }}>${p.revenue.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>${p.cost.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', color: p.profit >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)', fontWeight: 500 }}>${p.profit.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Category sales */}
          {tab === 'categories' && Array.isArray(data) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '20px' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category}: ${(percent*100).toFixed(0)}%`}>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: 'var(--color-background-secondary)' }}>
                    {['Category','Revenue','Items sold'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{data.map(c => (
                    <tr key={c.category} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.category}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-info)' }}>${c.revenue.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px' }}>{c.items_sold}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profit */}
          {tab === 'profit' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
              {[['Revenue', `$${data.revenue?.toFixed(2)}`, 'var(--color-text-info)'],['Gross profit', `$${data.gross_profit?.toFixed(2)}`, 'var(--color-text-success)'],['Net profit', `$${data.net_profit?.toFixed(2)}`, 'var(--color-text-success)'],['Cost', `$${data.cost?.toFixed(2)}`, 'var(--color-text-secondary)'],['Expenses', `$${data.expenses?.toFixed(2)}`, 'var(--color-text-warning)'],['Margin', `${data.margin_pct?.toFixed(1)}%`, 'var(--color-text-info)']].map(([l,v,c]) => (
                <div key={l} style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>{l}</div>
                  <div style={{ fontSize: '24px', fontWeight: 500, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Cashier performance */}
          {tab === 'cashiers' && Array.isArray(data) && (
            <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ background: 'var(--color-background-secondary)' }}>
                  {['Cashier','Total sales','Total revenue'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>)}
                </tr></thead>
                <tbody>{data.map(c => (
                  <tr key={c.cashier_id} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '10px 14px' }}>{c.total_sales}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-info)', fontWeight: 500 }}>${c.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Tax report */}
          {tab === 'tax' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              {[['Transactions', data.total_transactions],['Total revenue', `$${data.total_revenue?.toFixed(2)}`],['Taxable amount', `$${data.taxable_amount?.toFixed(2)}`],['GST collected', `$${data.total_tax_collected?.toFixed(2)}`]].map(([l,v]) => (
                <div key={l} style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>{l}</div>
                  <div style={{ fontSize: '22px', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Inventory valuation */}
          {tab === 'inventory' && data.items && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Total cost value</div>
                  <div style={{ fontSize: '24px', fontWeight: 500 }}>${data.total_cost_value?.toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Total sell value</div>
                  <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--color-text-info)' }}>${data.total_sell_value?.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: 'var(--color-background-secondary)' }}>
                    {['Product','Stock','Cost price','Sell price','Cost value','Sell value'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{data.items.map(p => (
                    <tr key={p.id} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '10px 14px' }}>{p.stock_qty}</td>
                      <td style={{ padding: '10px 14px' }}>${p.cost_price.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px' }}>${p.selling_price.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px' }}>${p.cost_value.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-info)' }}>${p.sell_value.toFixed(2)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
