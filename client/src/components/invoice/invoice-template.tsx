import { DATE_FORMATTER, CURRENCY_FORMATTER } from "@/lib/constants";
import type { InvoiceWithItems } from "@shared/schema";

interface InvoiceTemplateProps {
  invoice: InvoiceWithItems;
}

export function InvoiceTemplate({ invoice }: InvoiceTemplateProps) {
  // A4 size styles - 210mm × 297mm
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-8 mx-auto" id="invoice-template">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{invoice.storeName}</h1>
          <p className="text-gray-600 mt-1">{invoice.storeAddress}</p>
          {invoice.storePhone && <p className="text-gray-600">{invoice.storePhone}</p>}
          {invoice.storeEmail && <p className="text-gray-600">{invoice.storeEmail}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold text-gray-900">INVOICE</h2>
          <p className="text-gray-600 mt-1">#{invoice.invoiceNumber}</p>
          <p className="text-gray-600">Date: {DATE_FORMATTER.format(new Date(invoice.date))}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-gray-600 font-semibold mb-2">Bill To:</h3>
        <h4 className="text-lg font-medium">{invoice.customer.name}</h4>
        <p className="text-gray-600">{invoice.customer.email}</p>
        {invoice.customer.phone && <p className="text-gray-600">{invoice.customer.phone}</p>}
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-2 text-left">Item</th>
            <th className="py-2 text-right">Quantity</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.product.name}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">
                {CURRENCY_FORMATTER.format(Number(item.price))}
              </td>
              <td className="py-2 text-right">
                {CURRENCY_FORMATTER.format(Number(item.price) * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="py-2 text-right font-semibold">Total:</td>
            <td className="py-2 text-right font-semibold">
              {CURRENCY_FORMATTER.format(Number(invoice.total))}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-8">
          <h3 className="text-gray-600 font-semibold mb-2">Notes:</h3>
          <p className="text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}
