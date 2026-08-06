"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createAgreementAction } from "@/lib/actions/agreements";
import { getClients, type ClientWithProfile } from "@/lib/actions/clients";
import { getProjects, type ProjectWithClient } from "@/lib/actions/projects";

export default function NewAgreementPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getClients().then(setClients).catch(() => {}); getProjects().then(setProjects).catch(() => {}); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, send: boolean) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;

    const input = {
      client_id: (form.elements.namedItem("client_id") as HTMLSelectElement).value,
      project_id: (form.elements.namedItem("project_id") as HTMLSelectElement).value || undefined,
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      agreement_number: (form.elements.namedItem("agreement_number") as HTMLInputElement).value,
      amount: Number((form.elements.namedItem("amount") as HTMLInputElement).value) || undefined,
      start_date: (form.elements.namedItem("start_date") as HTMLInputElement).value || undefined,
      expiry_date: (form.elements.namedItem("expiry_date") as HTMLInputElement).value || undefined,
      scope_of_work: (form.elements.namedItem("scope_of_work") as HTMLTextAreaElement).value,
      deliverables: (form.elements.namedItem("deliverables") as HTMLTextAreaElement).value,
      payment_terms: (form.elements.namedItem("payment_terms") as HTMLTextAreaElement).value,
      revision_policy: (form.elements.namedItem("revision_policy") as HTMLTextAreaElement).value || undefined,
      support_terms: (form.elements.namedItem("support_terms") as HTMLTextAreaElement).value || undefined,
      client_responsibilities: (form.elements.namedItem("client_responsibilities") as HTMLTextAreaElement).value || undefined,
      cancellation_terms: (form.elements.namedItem("cancellation_terms") as HTMLTextAreaElement).value || undefined,
      additional_terms: (form.elements.namedItem("additional_terms") as HTMLTextAreaElement).value || undefined,
      send,
    };

    const result = await createAgreementAction(input);
    setLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(send ? "Agreement sent to client" : "Agreement saved as draft");
    router.push("/admin/agreements");
  }

  // Auto-generate agreement number
  const [agrNumber] = useState(() => `AGR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Create Agreement" description="Draft a new client agreement" />
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Agreement Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
                  <Select name="client_id" required><option value="">Select client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.profiles.full_name} — {c.company}</option>)}</Select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
                  <Select name="project_id"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agreement Title *</label><Input name="title" required placeholder="Website Development Agreement" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agreement Number</label><Input name="agreement_number" defaultValue={agrNumber} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Project Amount (₹)</label><Input name="amount" type="number" placeholder="50000" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label><Input name="start_date" type="date" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Completion</label><Input name="expiry_date" type="date" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Scope of Work *</label><Textarea name="scope_of_work" required rows={4} placeholder="Detailed description of work to be performed..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Deliverables *</label><Textarea name="deliverables" required rows={3} placeholder="List of deliverables..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms *</label><Textarea name="payment_terms" required rows={3} placeholder="Payment schedule and terms..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Revision Policy</label><Textarea name="revision_policy" rows={2} placeholder="Number of revisions included..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Support / Maintenance Terms</label><Textarea name="support_terms" rows={2} placeholder="Post-delivery support details..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Client Responsibilities</label><Textarea name="client_responsibilities" rows={2} placeholder="What the client needs to provide..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Cancellation Terms</label><Textarea name="cancellation_terms" rows={2} placeholder="Cancellation policy..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Terms</label><Textarea name="additional_terms" rows={2} placeholder="Any other terms..." /></div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" variant="outline" disabled={loading}>Save Draft</Button>
            <Button type="button" disabled={loading} onClick={(e) => {
              const form = (e.target as HTMLElement).closest("form")?.parentElement?.querySelector("form") || document.querySelector("form");
              if (form && form.checkValidity()) { handleSubmit({ preventDefault: () => {}, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>, true); }
              else { form?.reportValidity(); }
            }}>
              {loading ? <LoadingSpinner size="sm" /> : "Send to Client"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
