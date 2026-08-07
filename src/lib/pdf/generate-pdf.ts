"use client";

export interface PdfData {
  type: "invoice" | "quotation" | "agreement";
  documentNumber: string;
  date: string;
  dueDate?: string;
  status?: string;
  companyName: string;
  companySubtitle?: string;
  companyEmail: string;
  companyAddress: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress?: string;
  projectName?: string;
  projectRef?: string;
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal?: number;
  discount?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  paidAmount?: number;
  balance?: number;
  sections?: { title: string; content: string }[];
  notes?: string;
  terms?: string;
  validUntil?: string;
  gstin?: string;
  pan?: string;
  upiId?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function getStatusBadge(status?: string): string {
  if (!status) return "";
  const colors: Record<string, { bg: string; text: string }> = {
    paid: { bg: "#ecfdf5", text: "#065f46" },
    pending: { bg: "#fffbeb", text: "#92400e" },
    overdue: { bg: "#fef2f2", text: "#991b1b" },
    draft: { bg: "#f8fafc", text: "#64748b" },
  };
  const style = colors[status] || colors.pending;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:${style.bg};color:${style.text}">${status}</span>`;
}

export function generatePdfHtml(data: PdfData): string {
  const typeLabel = data.type === "invoice" ? "INVOICE" : data.type === "quotation" ? "QUOTATION" : "PROJECT AGREEMENT";

  // For agreements, use sections-based layout
  if (data.type === "agreement") {
    const sectionsHtml = data.sections?.map((s) => `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:600;color:#1e293b;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.3px">${s.title}</h3>
        <p style="font-size:13px;color:#475569;margin:0;line-height:1.7;white-space:pre-wrap">${s.content}</p>
      </div>
    `).join("") || "";

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${typeLabel} ${data.documentNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#334155;line-height:1.5;background:#fff}@page{size:A4;margin:20mm}@media print{body{padding:0}}@media screen{body{padding:40px}}</style></head><body>
<div style="max-width:780px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1e293b;margin-bottom:28px">
    <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="width:32px;height:32px;background:#1e293b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px">iW</div><div><p style="font-size:16px;font-weight:700;color:#1e293b">${data.companyName.toUpperCase()}</p>${data.companySubtitle ? `<p style="font-size:11px;color:#64748b">${data.companySubtitle}</p>` : ""}</div></div><p style="font-size:12px;color:#64748b;margin-top:8px">${data.companyEmail}</p><p style="font-size:12px;color:#64748b">${data.companyAddress}</p></div>
    <div style="text-align:right"><h1 style="font-size:28px;font-weight:700;color:#1e293b">${typeLabel}</h1><p style="font-size:12px;color:#64748b;margin-top:10px"><span style="color:#94a3b8">No:</span> <strong style="color:#1e293b">${data.documentNumber}</strong></p><p style="font-size:12px;color:#64748b;margin-top:2px"><span style="color:#94a3b8">Date:</span> ${data.date}</p></div>
  </div>
  <div style="display:flex;gap:24px;margin-bottom:28px">
    <div style="flex:1;padding:16px 20px;background:#f8fafc;border-radius:6px"><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px">Client</p><p style="font-size:14px;font-weight:600;color:#1e293b">${data.clientName}</p>${data.clientCompany ? `<p style="font-size:12px;color:#475569;margin-top:2px">${data.clientCompany}</p>` : ""}${data.clientEmail ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${data.clientEmail}</p>` : ""}</div>
    ${data.projectName ? `<div style="flex:1;padding:16px 20px;background:#f8fafc;border-radius:6px"><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px">Project</p><p style="font-size:14px;font-weight:600;color:#1e293b">${data.projectName}</p></div>` : ""}
  </div>
  ${sectionsHtml}
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center"><p style="font-size:11px;color:#94a3b8">Thank you for your business.</p></div>
</div></body></html>`;
  }

  // Invoice / Quotation layout — minimal & spacious
  const itemsHtml = data.items?.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#fafbfc"}">
      <td style="padding:14px 16px;font-size:13px;color:#1e293b">${item.description}</td>
      <td style="padding:14px 16px;font-size:13px;color:#475569;text-align:center">${item.quantity}</td>
      <td style="padding:14px 16px;font-size:13px;color:#475569;text-align:right">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:14px 16px;font-size:13px;color:#1e293b;text-align:right;font-weight:500">${formatCurrency(item.total)}</td>
    </tr>
  `).join("") || "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${typeLabel} ${data.documentNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#334155;line-height:1.5;background:#fff}@page{size:A4;margin:20mm}@media print{body{padding:0}}@media screen{body{padding:40px}}</style></head><body>
<div style="max-width:780px;margin:0 auto">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:28px;border-bottom:2px solid #1e293b;margin-bottom:32px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="width:32px;height:32px;background:#1e293b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px">iW</div>
        <div>
          <p style="font-size:16px;font-weight:700;color:#1e293b;letter-spacing:-0.3px">${data.companyName.toUpperCase()}</p>
          ${data.companySubtitle ? `<p style="font-size:11px;color:#64748b;margin-top:-1px">${data.companySubtitle}</p>` : ""}
        </div>
      </div>
      <p style="font-size:12px;color:#64748b;margin-top:10px">${data.companyEmail}</p>
      <p style="font-size:12px;color:#64748b">${data.companyAddress}</p>
    </div>
    <div style="text-align:right">
      <h1 style="font-size:28px;font-weight:700;color:#1e293b;letter-spacing:-0.5px">${typeLabel}</h1>
      <div style="margin-top:12px">
        <p style="font-size:12px;color:#64748b"><span style="color:#94a3b8">No:</span> <strong style="color:#1e293b">${data.documentNumber}</strong></p>
        <p style="font-size:12px;color:#64748b;margin-top:3px"><span style="color:#94a3b8">Date:</span> ${data.date}</p>
        ${data.dueDate ? `<p style="font-size:12px;color:#64748b;margin-top:3px"><span style="color:#94a3b8">Due:</span> ${data.dueDate}</p>` : ""}
        ${data.validUntil ? `<p style="font-size:12px;color:#64748b;margin-top:3px"><span style="color:#94a3b8">Valid Until:</span> ${data.validUntil}</p>` : ""}
      </div>
      ${data.status ? `<div style="margin-top:12px">${getStatusBadge(data.status)}</div>` : ""}
    </div>
  </div>

  <!-- Bill To / From -->
  <div style="display:flex;gap:32px;margin-bottom:36px">
    <div style="flex:1">
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px">Bill To</p>
      <p style="font-size:14px;font-weight:600;color:#1e293b">${data.clientName}</p>
      ${data.clientCompany ? `<p style="font-size:12px;color:#475569;margin-top:3px">${data.clientCompany}</p>` : ""}
      ${data.clientEmail ? `<p style="font-size:12px;color:#64748b;margin-top:3px">${data.clientEmail}</p>` : ""}
    </div>
    ${data.projectName ? `<div style="flex:1"><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px">Project</p><p style="font-size:14px;font-weight:600;color:#1e293b">${data.projectName}</p></div>` : ""}
  </div>

  ${data.items && data.items.length > 0 ? `
  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0">
        <th style="padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600">Description</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;width:60px">Qty</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;width:120px">Rate</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;width:120px">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:40px">
    <div style="width:260px">
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#64748b">
        <span>Subtotal</span><span style="color:#1e293b">${formatCurrency(data.subtotal || 0)}</span>
      </div>
      ${data.discount && data.discountAmount ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#64748b"><span>Discount (${data.discount}%)</span><span style="color:#1e293b">-${formatCurrency(data.discountAmount)}</span></div>` : ""}
      ${data.taxRate && data.taxAmount ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#64748b"><span>Tax (${data.taxRate}%)</span><span style="color:#1e293b">${formatCurrency(data.taxAmount)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:700;border-top:2px solid #1e293b;margin-top:8px;color:#1e293b">
        <span>Total</span><span>${formatCurrency(data.total || 0)}</span>
      </div>
      ${data.paidAmount && data.paidAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#64748b"><span>Paid</span><span style="color:#059669;font-weight:500">${formatCurrency(data.paidAmount)}</span></div>` : ""}
      ${data.balance && data.balance > 0 ? `<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:600;color:#1e293b"><span>Balance Due</span><span style="color:#dc2626">${formatCurrency(data.balance)}</span></div>` : ""}
    </div>
  </div>` : ""}

  <!-- Footer -->
  <div style="text-align:center;padding-top:24px;border-top:1px solid #e2e8f0">
    <p style="font-size:11px;color:#94a3b8">Thank you for your business.</p>
  </div>

</div></body></html>`;
}

export function downloadPdf(data: PdfData) {
  const html = generatePdfHtml(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);
}
