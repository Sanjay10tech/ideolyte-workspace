"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createInvoiceAction } from "@/lib/actions/invoices";
import { getClients, type ClientWithProfile } from "@/lib/actions/clients";
import { getProjects, type ProjectWithClient } from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/utils";

interface LineItem { description: string; quantity: number; unit_price: number; total: number }

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getClients().then(setClients).catch(() => {}); getProjects().then(setProjects).catch(() => {}); }, []);

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      next[idx].total = next[idx].quantity * next[idx].unit_price;
      return next;
    });
  }

  function addItem() { setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0, total: 0 }]); }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)); }

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (taxRate / 100);
  const total = taxable + taxAmount;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0 || items.every(i => !i.description)) { toast.error("Add at least one line item"); return; }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));
    formData.set("discount", String(discount));
    formData.set("tax_rate", String(taxRate));
    const result = await createInvoiceAction(formData);
    setLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Invoice created");
    router.push(`/admin/invoices/${result.id}`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Create Invoice" description="Generate a new invoice" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number *</label><Input name="invoice_number" required placeholder="INV-2026-001" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date *</label><Input name="issued_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date *</label><Input name="due_date" type="date" required /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
                <Select name="client_id" required><option value="">Select client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.profiles.full_name} — {c.company}</option>)}</Select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
                <Select name="project_id"><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Line Items</CardTitle><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                <div className="col-span-5">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">Rate</div><div className="col-span-2">Amount</div><div className="col-span-1"></div>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-5" placeholder="Service description" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} />
                  <Input className="col-span-2" type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, "quantity", Number(e.target.value))} />
                  <Input className="col-span-2" type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", Number(e.target.value))} />
                  <p className="col-span-2 text-sm font-medium text-gray-700 text-right">{formatCurrency(item.total)}</p>
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Discount %</span><Input className="w-16 h-7 text-xs" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
                {discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
                <div className="flex justify-between items-center"><span className="text-gray-500">Tax %</span><Input className="w-16 h-7 text-xs" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} /></div>
                {taxRate > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(taxAmount)}</span></div>}
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5"><label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label><Textarea name="notes" rows={3} placeholder="Payment terms, bank details, etc." /></CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? <LoadingSpinner size="sm" /> : "Create Invoice"}</Button>
        </div>
      </form>
    </div>
  );
}
