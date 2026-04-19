import { forwardRef } from 'react';
import type { LocalOrder } from '../../offline/db';

interface Props {
  order: LocalOrder;
}

export const InvoicePrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  const invoiceNumber = `INV-${order.clientId.slice(0, 8).toUpperCase()}`;
  const date = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(order.createdAt));

  return (
    <div ref={ref} className="invoice-print" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { margin: 0; }
          .invoice-print { width: 100%; }
        }

        .invoice-print {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          color: #130F2A;
          font-family: 'Cairo', sans-serif;
          background: #ffffff;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #7C3AED;
        }

        .invoice-title {
          font-size: 32px;
          font-weight: 700;
          color: #7C3AED;
        }

        .invoice-meta { text-align: left; font-size: 14px; color: #6B5B9A; }
        .invoice-number { font-size: 16px; font-weight: 600; color: #7C3AED; }

        .customer-block {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
        }

        .customer-label { font-size: 12px; color: #888; margin-bottom: 4px; }
        .customer-name { font-size: 18px; font-weight: 600; }
        .customer-phone { font-size: 14px; color: #555; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        th {
          background: #7C3AED;
          color: white;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 600;
        }

        td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }

        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background: #f8f9fa; }

        .total-row {
          border-top: 2px solid #7C3AED;
          font-size: 18px;
          font-weight: 700;
          color: #7C3AED;
        }

        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 13px;
        }
      `}</style>

      <div className="invoice-header">
        <div>
          <div className="invoice-title">دكان</div>
          <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>فاتورة ضريبية</div>
        </div>
        <div className="invoice-meta">
          <div className="invoice-number">{invoiceNumber}</div>
          <div style={{ marginTop: '4px' }}>{date}</div>
        </div>
      </div>

      {(order.customerName || order.customerPhone) && (
        <div className="customer-block">
          <div className="customer-label">العميل</div>
          {order.customerName && <div className="customer-name">{order.customerName}</div>}
          {order.customerPhone && <div className="customer-phone">{order.customerPhone}</div>}
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th style={{ textAlign: 'right' }}>المنتج</th>
            <th style={{ textAlign: 'center' }}>الكمية</th>
            <th style={{ textAlign: 'center' }}>سعر الوحدة</th>
            <th style={{ textAlign: 'left' }}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'center' }}>{item.price.toFixed(2)} جنيه</td>
              <td style={{ textAlign: 'left' }}>
                {(item.price * item.quantity).toFixed(2)} جنيه
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={3} style={{ textAlign: 'right' }}>الإجمالي</td>
            <td style={{ textAlign: 'left' }}>{order.total.toFixed(2)} جنيه</td>
          </tr>
        </tbody>
      </table>

      {order.notes && (
        <div style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
          <strong>ملاحظات: </strong>{order.notes}
        </div>
      )}

      <div className="footer">شكراً لتعاملكم معنا — دكان</div>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
