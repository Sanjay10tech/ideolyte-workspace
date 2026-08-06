"use client";

export interface PdfData {
  type: "invoice" | "quotation" | "agreement";
  documentNumber: string;
  date: string;
  dueDate?: string;
  status?: string;
  // Company (from settings)
  companyName: string;
  companySubtitle?: string;
  companyEmail: string;
  companyAddress: string;
  gstin?: string;
  pan?: string;
  upiId?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  // Client
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress?: string;
  // Project
  projectName?: string;
  projectRef?: string;
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
  // Notes & Terms
  notes?: string;
  terms?: string;
  validUntil?: string;
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

  const itemsHtml = data.items?.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}">
      <td style="padding:12px 16px;font-size:13px;color:#1e293b">${item.description}</td>
      <td style="padding:12px 16px;font-size:13px;color:#475569;text-align:center">${item.quantity}</td>
      <td style="padding:12px 16px;font-size:13px;color:#475569;text-align:right">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:12px 16px;font-size:13px;color:#1e293b;text-align:right;font-weight:500">${formatCurrency(item.total)}</td>
    </tr>
  `).join("") || "";

  const sectionsHtml = data.sections?.map((s) => `
    <div style="margin-bottom:20px">
      <h3 style="font-size:13px;font-weight:600;color:#1e293b;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.3px">${s.title}</h3>
      <p style="font-size:13px;color:#475569;margin:0;line-height:1.7;white-space:pre-wrap">${s.content}</p>
    </div>
  `).join("") || "";

  // Payment details section
  let paymentHtml = "";
  if (data.type === "invoice" && (data.upiId || data.bankName)) {
    paymentHtml = `<div style="margin-top:24px;padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:10px">Payment Details</p>
      ${data.upiId ? `<p style="font-size:12px;color:#475569;margin:3px 0"><strong style="color:#1e293b">UPI ID:</strong> ${data.upiId}</p>` : ""}
      ${data.bankName ? `<p style="font-size:12px;color:#475569;margin:3px 0"><strong style="color:#1e293b">Bank:</strong> ${data.bankName}</p>` : ""}
      ${data.accountName ? `<p style="font-size:12px;color:#475569;margin:3px 0"><strong style="color:#1e293b">Account Name:</strong> ${data.accountName}</p>` : ""}
      ${data.accountNumber ? `<p style="font-size:12px;color:#475569;margin:3px 0"><strong style="color:#1e293b">Account No:</strong> ${data.accountNumber}</p>` : ""}
      ${data.ifsc ? `<p style="font-size:12px;color:#475569;margin:3px 0"><strong style="color:#1e293b">IFSC:</strong> ${data.ifsc}</p>` : ""}
    </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${typeLabel} ${data.documentNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#334155;line-height:1.5;background:#fff}
@page{size:A4;margin:20mm}
@media print{body{padding:0}@page{margin:15mm}}
@media screen{body{padding:40px}}
</style></head><body>
<div style="max-width:780px;margin:0 auto">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1e293b;margin-bottom:28px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="width:32px;height:32px;background:#1e293b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px">iW</div>
        <div>
          <p style="font-size:16px;font-weight:700;color:#1e293b;letter-spacing:-0.3px">${data.companyName.toUpperCase()}</p>
          ${data.companySubtitle ? `<p style="font-size:11px;color:#64748b;margin-top:-1px">${data.companySubtitle}</p>` : ""}
        </div>
      </div>
      <p style="font-size:12px;color:#64748b;margin-top:8px">${data.companyEmail}</p>
      <p style="font-size:12px;color:#64748b">${data.companyAddress}</p>
      ${data.gstin ? `<p style="font-size:11px;color:#64748b;margin-top:4px">GSTIN: ${data.gstin}</p>` : ""}
      ${data.pan ? `<p style="font-size:11px;color:#64748b">PAN: ${data.pan}</p>` : ""}
    </div>
    <div style="text-align:right">
      <h1 style="font-size:28px;font-weight:700;color:#1e293b;letter-spacing:-0.5px">${typeLabel}</h1>
      <div style="margin-top:10px">
        <p style="font-size:12px;color:#64748b"><span style="color:#94a3b8">No:</span> <strong style="color:#1e293b">${data.documentNumber}</strong></p>
        <p style="font-size:12px;color:#64748b;margin-top:2px"><span style="color:#94a3b8">Date:</span> ${data.date}</p>
        ${data.dueDate ? `<p style="font-size:12px;color:#64748b;margin-top:2px"><span style="color:#94a3b8">Due:</span> ${data.dueDate}</p>` : ""}
        ${data.validUntil ? `<p style="font-size:12px;color:#64748b;margin-top:2px"><span style="color:#94a3b8">Valid Until:</span> ${data.validUntil}</p>` : ""}
      </div>
      ${data.status ? `<div style="margin-top:10px">${getStatusBadge(data.status)}</div>` : ""}
    </div>
  </div>

  <!-- Client + Project Info -->
  <div style="display:flex;gap:24px;margin-bottom:28px">
    <div style="flex:1;padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px">Bill To</p>
      <p style="font-size:14px;font-weight:600;color:#1e293b">${data.clientName}</p>
      ${data.clientCompany ? `<p style="font-size:12px;color:#475569;margin-top:2px">${data.clientCompany}</p>` : ""}
      ${data.clientEmail ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${data.clientEmail}</p>` : ""}
      ${data.clientAddress ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${data.clientAddress}</p>` : ""}
    </div>
    ${data.projectName ? `
    <div style="flex:1;padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px">Project</p>
      <p style="font-size:14px;font-weight:600;color:#1e293b">${data.projectName}</p>
      ${data.projectRef ? `<p style="font-size:12px;color:#64748b;margin-top:2px">Ref: ${data.projectRef}</p>` : ""}
    </div>` : ""}
  </div>

  ${data.items && data.items.length > 0 ? `
  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
    <thead>
      <tr style="background:#1e293b">
        <th style="padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#fff;font-weight:600">Description</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#fff;font-weight:600;width:60px">Qty</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#fff;font-weight:600;width:120px">Rate</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#fff;font-weight:600;width:120px">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:28px">
    <div style="width:280px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
      <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:13px;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b">Subtotal</span><span style="color:#1e293b">${formatCurrency(data.subtotal || 0)}</span>
      </div>
      ${data.discount ? `<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:13px;border-bottom:1px solid #f1f5f9"><span style="color:#64748b">Discount (${data.discount}%)</span><span style="color:#1e293b">-${formatCurrency(data.discountAmount || 0)}</span></div>` : ""}
      ${data.taxRate ? `<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:13px;border-bottom:1px solid #f1f5f9"><span style="color:#64748b">Tax (${data.taxRate}%)</span><span style="color:#1e293b">${formatCurrency(data.taxAmount || 0)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:12px 16px;font-size:15px;font-weight:700;background:#1e293b;color:#fff">
        <span>Total</span><span>${formatCurrency(data.total || 0)}</span>
      </div>
      ${data.paidAmount !== undefined && data.paidAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:13px;border-bottom:1px solid #f1f5f9"><span style="color:#64748b">Paid</span><span style="color:#059669;font-weight:500">${formatCurrency(data.paidAmount)}</span></div>` : ""}
      ${data.balance !== undefined && data.balance > 0 ? `<div style="display:flex;justify-content:space-between;padding:12px 16px;font-size:14px;font-weight:600;background:#fef2f2"><span style="color:#1e293b">Balance Due</span><span style="color:#991b1b">${formatCurrency(data.balance)}</span></div>` : ""}
    </div>
  </div>` : ""}

  ${sectionsHtml ? `<div style="margin-bottom:28px">${sectionsHtml}</div>` : ""}

  ${paymentHtml}

  ${data.notes ? `<div style="margin-top:24px;padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:6px">Notes</p><p style="font-size:12px;color:#475569;line-height:1.6">${data.notes}</p></div>` : ""}

  ${data.terms ? `<div style="margin-top:16px;padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:6px">Terms & Conditions</p><p style="font-size:12px;color:#475569;line-height:1.6;white-space:pre-wrap">${data.terms}</p></div>` : ""}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:2px solid #1e293b;text-align:center">
    <p style="font-size:12px;font-weight:600;color:#1e293b">${data.companyName}</p>
    <p style="font-size:11px;color:#64748b;margin-top:2px">${data.companyAddress}</p>
    <p style="font-size:11px;color:#64748b">${data.companyEmail}</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:8px">Thank you for your business.</p>
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
