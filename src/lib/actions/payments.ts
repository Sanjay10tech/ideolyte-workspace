"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface PaymentWithInvoice {
  id: string;
  invoice_id: string;
  client_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
  invoices: { invoice_number: string; total_amount: number };
  clients: { company: string; profiles: { full_name: string } };
}

export async function getPayments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, invoices(invoice_number, total_amount), clients(company, profiles(full_name))")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as PaymentWithInvoice[];
}

export async function recordPaymentAction(formData: FormData) {
  const supabase = await createAdminClient();

  const invoice_id = formData.get("invoice_id") as string;
  const client_id = formData.get("client_id") as string;
  const amount = Number(formData.get("amount"));
  const payment_method = formData.get("payment_method") as string;
  const transaction_id = (formData.get("transaction_id") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const paid_at = (formData.get("paid_at") as string) || new Date().toISOString();

  const { error } = await supabase
    .from("payments")
    .insert({ invoice_id, client_id, amount, payment_method, transaction_id, notes, paid_at });

  if (error) return { error: error.message };

  // Update invoice paid_amount and status
  const { data: invoice } = await supabase.from("invoices").select("total_amount, paid_amount").eq("id", invoice_id).single();
  if (invoice) {
    const newPaid = (invoice.paid_amount || 0) + amount;
    const newStatus = newPaid >= invoice.total_amount ? "paid" : "pending";
    await supabase.from("invoices").update({ paid_amount: newPaid, status: newStatus, paid_date: newStatus === "paid" ? new Date().toISOString().split("T")[0] : null }).eq("id", invoice_id);
  }

  // Log activity
  const currentUser = await supabase.auth.getUser();
  if (currentUser.data.user) {
    await supabase.from("activity_logs").insert({
      user_id: currentUser.data.user.id,
      action: "payment_recorded",
      entity_type: "payment",
      entity_id: invoice_id,
      metadata: { amount, method: payment_method },
    });
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/invoices");
  revalidatePath("/client");
  return { success: true };
}
