"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

export interface InvoiceWithClient {
  id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  discount: number;
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients: { company: string; profiles: { full_name: string; email: string; phone: string | null } };
  projects?: { name: string } | null;
  invoice_items: InvoiceItem[];
}

export async function getInvoices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(company, profiles(full_name, email, phone)), projects(name), invoice_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as InvoiceWithClient[];
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(company, profiles(full_name, email, phone, company)), projects(name), invoice_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as InvoiceWithClient;
}

export async function getClientInvoices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) return [];
  const { data, error } = await supabase.from("invoices").select("*, projects(name), invoice_items(*)").eq("client_id", client.id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as InvoiceWithClient[];
}

export async function createInvoiceAction(formData: FormData) {
  const supabase = await createAdminClient();

  const client_id = formData.get("client_id") as string;
  const project_id = (formData.get("project_id") as string) || null;
  const invoice_number = formData.get("invoice_number") as string;
  const issued_date = formData.get("issued_date") as string;
  const due_date = formData.get("due_date") as string;
  const notes = (formData.get("notes") as string) || null;
  const discount = Number(formData.get("discount") || 0);
  const tax_rate = Number(formData.get("tax_rate") || 0);
  const itemsJson = formData.get("items") as string;
  const items: InvoiceItem[] = itemsJson ? JSON.parse(itemsJson) : [];

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxable = subtotal - discountAmount;
  const tax_amount = taxable * (tax_rate / 100);
  const total_amount = taxable + tax_amount;

  const { data, error } = await supabase
    .from("invoices")
    .insert({ client_id, project_id, invoice_number, issued_date, due_date, notes, subtotal, tax_rate, tax_amount, total_amount, discount, status: "draft", paid_amount: 0 })
    .select()
    .single();

  if (error) return { error: error.message };

  if (items.length > 0) {
    const itemRows = items.map((item, idx) => ({
      invoice_id: data.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      sort_order: idx,
    }));
    await supabase.from("invoice_items").insert(itemRows);
  }

  revalidatePath("/admin/invoices");
  return { success: true, id: data.id };
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createAdminClient();
  const updates: Record<string, unknown> = { status };
  if (status === "paid") updates.paid_date = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("invoices").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/invoices");
  revalidatePath("/client");
  return { success: true };
}
