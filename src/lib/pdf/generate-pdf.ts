"use client";

export interface PdfData {
  type: "invoice" | "quotation" | "agreement";
  documentNumber: string;
  date: string;
  dueDate?: string;
  // Company
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  // Client
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  // Project
  projectName?: string;
  // Items
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
  // Totals
  subtotal?: number;
  discount?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  paidAmount?: number;
  balance?: number;
  // Agreement content
  sections?: { title: string; content: string }[];
  // Notes
  notes?: string;
  terms?: string;
  validUntil?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function generatePdfHtml(data: PdfData): string {
  const itemsHtml = data.items?.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:left;font-size:13px">${item.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:500">${formatCurrency(item.total)}</td>
    </tr>
  `).join("") || "";

  const sectionsHtml = data.sections?.map((s) => `
    <div style="margin-bottom:16px">
      <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 6px">${s.title}</h3>
      <p style="font-size:13px;color:#475569;margin:0;line-height:1.6;white-space:pre-wrap">${s.content}</p>
    </div>
  `).join("") || "";

  const typeLabel = data.type === "invoice" ? "INVOICE" : data.type === "quotation" ? "QUOTATION" : "PROJECT AGREEMENT";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${typeLabel} ${data.documentNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#334155;line-height:1.5;padding:40px}
@media print{body{padding:20px}}</style></head><body>
<div style="max-width:800px;margin:0 auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #1e293b">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">iW</div>
        <span style="font-size:18px;font-weight:700;color:#1e293b">${data.companyName}</span>
      </div>
      <p style="font-size:12px;color:#64748b">${data.companyEmail}</p>
      <p style="font-size:12px;color:#64748b">${data.companyPhone}</p>
      <p style="font-size:12px;color:#64748b">${data.companyAddress}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:11px;font-weight:600;letter-spacing:1px;color:#64748b;margin-bottom:2px">IDEOLYTE</p>
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px">${typeLabel}</h1>
      <p style="font-size:13px;color:#64748b"><strong>#</strong> ${data.documentNumber}</p>
      <p style="font-size:13px;color:#64748b"><strong>Date:</strong> ${data.date}</p>
      ${data.dueDate ? `<p style="font-size:13px;color:#64748b"><strong>Due:</strong> ${data.dueDate}</p>` : ""}
      ${data.validUntil ? `<p style="font-size:13px;color:#64748b"><strong>Valid Until:</strong> ${data.validUntil}</p>` : ""}
    </div>
  </div>

  <!-- Client Info -->
  <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px">
    <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;margin-bottom:6px">Bill To</p>
    <p style="font-size:14px;font-weight:600;color:#1e293b">${data.clientName}</p>
    <p style="font-size:13px;color:#64748b">${data.clientCompany}</p>
    <p style="font-size:13px;color:#64748b">${data.clientEmail}</p>
    ${data.projectName ? `<p style="font-size:13px;color:#64748b;margin-top:4px"><strong>Project:</strong> ${data.projectName}</p>` : ""}
  </div>

  ${data.items && data.items.length > 0 ? `
  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">Description</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">Rate</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
    <div style="width:260px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
        <span style="color:#64748b">Subtotal</span><span>${formatCurrency(data.subtotal || 0)}</span>
      </div>
      ${data.discount ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#64748b">Discount (${data.discount}%)</span><span>-${formatCurrency(data.discountAmount || 0)}</span></div>` : ""}
      ${data.taxRate ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#64748b">Tax (${data.taxRate}%)</span><span>${formatCurrency(data.taxAmount || 0)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:15px;font-weight:700;border-top:2px solid #1e293b;margin-top:6px">
        <span>Total</span><span>${formatCurrency(data.total || 0)}</span>
      </div>
      ${data.paidAmount !== undefined ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#64748b">Paid</span><span style="color:#059669">${formatCurrency(data.paidAmount)}</span></div>` : ""}
      ${data.balance !== undefined ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;font-weight:600"><span>Balance Due</span><span style="color:#dc2626">${formatCurrency(data.balance)}</span></div>` : ""}
    </div>
  </div>` : ""}

  ${sectionsHtml ? `<div style="margin-bottom:24px">${sectionsHtml}</div>` : ""}

  ${data.notes ? `<div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px"><p style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;margin-bottom:4px">Notes</p><p style="font-size:13px;color:#475569">${data.notes}</p></div>` : ""}
  ${data.terms ? `<div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px"><p style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;margin-bottom:4px">Terms & Conditions</p><p style="font-size:13px;color:#475569;white-space:pre-wrap">${data.terms}</p></div>` : ""}

  <!-- Footer -->
  <div style="text-align:center;padding-top:24px;border-top:1px solid #e2e8f0;margin-top:32px">
    <p style="font-size:12px;color:#94a3b8">Thank you for your business!</p>
    <p style="font-size:11px;color:#cbd5e1;margin-top:4px">${data.companyName} · ${data.companyEmail}</p>
  </div>
</div></body></html>`;
}

export function downloadPdf(data: PdfData) {
  const html = generatePdfHtml(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
