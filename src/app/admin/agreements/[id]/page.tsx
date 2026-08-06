"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Send, Download, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { getAgreementById, sendAgreementToClient, type AgreementWithClient } from "@/lib/actions/agreements";
import { downloadPdf, type PdfData } from "@/lib/pdf/generate-pdf";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AgreementDetailPage() {
  const params = useParams();
  const [agreement, setAgreement] = useState<AgreementWithClient | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getAgreementById(params.id as string); setAgreement(d); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, [params.id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;
  if (!agreement) return <p className="text-center text-gray-500 py-12">Agreement not found</p>;

  async function handleSend() {
    const result = await sendAgreementToClient(agreement!.id);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Agreement sent to client"); load();
  }

  function handleDownload() {
    const sections = [];
    if (agreement!.scope_of_work) sections.push({ title: "Scope of Work", content: agreement!.scope_of_work });
    if (agreement!.deliverables) sections.push({ title: "Deliverables", content: agreement!.deliverables });
    if (agreement!.payment_terms) sections.push({ title: "Payment Terms", content: agreement!.payment_terms });
    if (agreement!.revision_policy) sections.push({ title: "Revision Policy", content: agreement!.revision_policy });
    if (agreement!.support_terms) sections.push({ title: "Support & Maintenance", content: agreement!.support_terms });
    if (agreement!.client_responsibilities) sections.push({ title: "Client Responsibilities", content: agreement!.client_responsibilities });
    if (agreement!.cancellation_terms) sections.push({ title: "Cancellation Terms", content: agreement!.cancellation_terms });
    if (agreement!.additional_terms) sections.push({ title: "Additional Terms", content: agreement!.additional_terms });

    const pdfData: PdfData = {
      type: "agreement",
      documentNumber: agreement!.agreement_number || agreement!.title,
      date: agreement!.signed_date ? formatDate(agreement!.signed_date) : formatDate(agreement!.created_at),
      status: agreement!.status,
      companyName: "Ideolyte", companySubtitle: "Digital Solutions & Technology", companyEmail: "hello@ideolyte.com", companyAddress: "Indore • Bengaluru, India",
      clientName: agreement!.clients?.profiles?.full_name || "", clientCompany: agreement!.clients?.company || "", clientEmail: agreement!.clients?.profiles?.email || "",
      projectName: agreement!.projects?.name || undefined,
      sections,
      notes: agreement!.content || undefined,
    };
    downloadPdf(pdfData);
  }

  const statusColor: Record<string, string> = { draft: "bg-slate-50 text-slate-600", sent: "bg-blue-50 text-blue-700", accepted: "bg-emerald-50 text-emerald-700", active: "bg-blue-50 text-blue-700" };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={agreement.title} description={agreement.agreement_number || undefined}>
        <div className="flex gap-2">
          <Badge className={`border text-xs ${statusColor[agreement.status] || "bg-slate-50 text-slate-600"}`}>{agreement.status}</Badge>
          {agreement.status === "draft" && <Button size="sm" onClick={handleSend}><Send className="h-3.5 w-3.5 mr-1" /> Send to Client</Button>}
          <Button size="sm" variant="outline" onClick={handleDownload}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
        </div>
      </PageHeader>

      {/* Accepted Status */}
      {agreement.accepted_at && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Agreement Accepted ✓</p>
            <p className="text-xs text-emerald-600">Accepted on {formatDate(agreement.accepted_at)}</p>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Client</p><p className="text-sm font-medium text-slate-900 mt-1">{agreement.clients?.profiles?.full_name}</p><p className="text-xs text-slate-400">{agreement.clients?.company}</p></Card>
        {agreement.projects?.name && <Card className="p-4"><p className="text-xs text-slate-500">Project</p><p className="text-sm font-medium text-slate-900 mt-1">{agreement.projects.name}</p></Card>}
        {agreement.amount && <Card className="p-4"><p className="text-xs text-slate-500">Amount</p><p className="text-sm font-medium text-slate-900 mt-1">{formatCurrency(agreement.amount)}</p></Card>}
        <Card className="p-4"><p className="text-xs text-slate-500">Created</p><p className="text-sm font-medium text-slate-900 mt-1">{formatDate(agreement.created_at)}</p></Card>
      </div>

      {/* Agreement Content */}
      <Card>
        <CardHeader><CardTitle className="text-base">Agreement Terms</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {agreement.scope_of_work && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Scope of Work</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.scope_of_work}</p></div>}
          {agreement.deliverables && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Deliverables</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.deliverables}</p></div>}
          {agreement.payment_terms && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment Terms</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.payment_terms}</p></div>}
          {agreement.revision_policy && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Revision Policy</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.revision_policy}</p></div>}
          {agreement.support_terms && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Support & Maintenance</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.support_terms}</p></div>}
          {agreement.client_responsibilities && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Client Responsibilities</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.client_responsibilities}</p></div>}
          {agreement.cancellation_terms && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Cancellation Terms</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.cancellation_terms}</p></div>}
          {agreement.additional_terms && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Additional Terms</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{agreement.additional_terms}</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}
