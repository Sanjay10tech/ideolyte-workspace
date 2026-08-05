"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

export interface QuotationWithClient {
  id: string;
  client_id: string;
  project_id: string | null;
  quotation_number: string;
  title: string;
  description: string | null;
  total_amount: number;
  status: string;
  valid_until: string | null;
  discount: number;
  tax_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients: { company: string; profiles: { full_name: string; email: string } };
  projects?: { name: string } | null;
  quotation_items: QuotationItem[];
}

export async function getQuotations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, clients(company, profiles(full_name, email)), projects(name), quotation_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as QuotationWithClient[];
}

export async function getQuotationById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, clients(company, profiles(full_name, email, phone, company)), projects(name), quotation_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as QuotationWithClient;
}

export async function createQuotationAction(formData: FormData) {
  const supabase = await createAdminClient();

  const client_id = formData.get("client_id") as string;
  const project_id = (formData.get("project_id") as string) || null;
  const quotation_number = formData.get("quotation_number") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const valid_until = (formData.get("valid_until") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const discount = Number(formData.get("discount") || 0);
  const tax_rate = Number(formData.get("tax_rate") || 0);
  const itemsJson = formData.get("items") as string;
  const items: QuotationItem[] = itemsJson ? JSON.parse(itemsJson) : [];

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (tax_rate / 100);
  const total_amount = taxable + taxAmount;

  const { data, error } = await supabase
    .from("quotations")
    .insert({ client_id, project_id, quotation_number, title, description, total_amount, valid_until, notes, status: "draft", discount, tax_rate })
    .select()
    .single();

  if (error) return { error: error.message };

  // Insert items
  if (items.length > 0) {
    const itemRows = items.map((item, idx) => ({
      quotation_id: data.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      sort_order: idx,
    }));
    await supabase.from("quotation_items").insert(itemRows);
  }

  revalidatePath("/admin/quotations");
  return { success: true, id: data.id };
}

export async function updateQuotationStatus(id: string, status: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/quotations");
  revalidatePath("/client");
  return { success: true };
}
