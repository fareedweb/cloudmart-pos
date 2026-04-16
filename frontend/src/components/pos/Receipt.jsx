import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export default function Receipt({ sale, onClose }) {
  const printRef = useRef()
  const handlePrint = useReactToPrint({ content: () => printRef.current })
  const now = new Date()

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '16px', width: '380px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <button onClick={handlePrint} style={{ flex: 1, padding: '9px', background: '#185FA5', color: '#E6F1FB', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}>Print Receipt</button>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: 'pointer', background: 'none', fontSize: '13px' }}>New Sale</button>
        </div>

        {/* Printable receipt */}
        <div ref={printRef} style={{ padding: '24px 20px', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>CLOUDMART</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Supermart</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>Tel: +65 0000 0000</div>
          </div>

          <div style={{ borderTop: '1px dashed var(--color-border-secondary)', borderBottom: '1px dashed var(--color-border-secondary)', padding: '8px 0', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Invoice:</span><span style={{ fontWeight: 700 }}>{sale.invoice_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
              <span>Date:</span><span>{now.toLocaleDateString()} {now.toLocaleTimeString()}</span>
            </div>
            {sale.customer && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                <span>Customer:</span><span>{sale.customer.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '6px', paddingBottom: '4px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <span style={{ flex: 2 }}>Item</span><span style={{ width: '40px', textAlign: 'center' }}>Qty</span><span style={{ width: '70px', textAlign: 'right' }}>Amount</span>
            </div>
            {sale.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ flex: 2 }}>{item.name}</span>
                <span style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ width: '70px', textAlign: 'right' }}>${item.line_total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '1px dashed var(--color-border-secondary)', paddingTop: '10px' }}>
            {[
              ['Subtotal', `$${(sale.subtotal || 0).toFixed(2)}`],
              sale.discount_amount > 0 ? ['Discount', `-$${sale.discount_amount.toFixed(2)}`] : null,
              ['GST', `$${(sale.tax_amount || 0).toFixed(2)}`],
            ].filter(Boolean).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-border-secondary)' }}>
              <span>TOTAL</span><span>${(sale.total_amount || 0).toFixed(2)}</span>
            </div>
            {sale.payment_method === 'cash' && sale.cash_given && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                  <span>Cash</span><span>${sale.cash_given.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Change</span><span>${(sale.change_given || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            <div>Thank you for shopping at CloudMart!</div>
            <div style={{ marginTop: '4px' }}>Goods sold are not returnable</div>
            <div style={{ marginTop: '8px', fontSize: '16px' }}>★★★★★</div>
          </div>
        </div>
      </div>
    </div>
  )
}
