"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { FileSignature, Download, CheckCircle2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getClientAgreements, acceptAgreementAction, type AgreementWithClient } from "@/lib/actions/agreements";
import { downloadPdf, type PdfData } from "@/lib/pdf/generate-pdf";
import { formatDate } from "@/lib/utils";

export default function ClientAgreementPage() {
  const [agreements, setAgreements] = useState<AgreementWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptChecked, setAcceptChecked] = useState<Record<string, boolean>>({});
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getClientAgreements(); setAgreements(d); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleAccept(id: string) {
    setAccepting(id);
    const result = await acceptAgreementAction(id);
    setAccepting(null);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Agreement accepted!");
    load();
  }

  function handleDownload(agr: AgreementWithClient) {
    const sections = [];
    if (agr.scope_of_work) sections.push({ title: "Scope of Work", content: agr.scope_of_work });
    if (agr.deliverables) sections.push({ title: "Deliverables", content: agr.deliverables });
    if (agr.timeline) sections.push({ title: "Timeline", content: agr.timeline });
    if (agr.payment_terms) sections.push({ title: "Payment Terms", content: agr.payment_terms });
    if (agr.revision_policy) sections.push({ title: "Revision Policy", content: agr.revision_policy });
    if (agr.support_terms) sections.push({ title: "Support Terms", content: agr.support_terms });
    if (agr.cancellation_terms) sections.push({ title: "Cancellation Terms", content: agr.cancellation_terms });
    if (agr.additional_terms) sections.push({ title: "Additional Terms", content: agr.additional_terms });

    const pdfData: PdfData = {
      type: "agreement", documentNumber: agr.title, date: agr.signed_date ? formatDate(agr.signed_date) : formatDate(agr.created_at),
      companyName: "Ideolyte", companyEmail: "hello@ideolyte.com", companyPhone: "+1 (555) 123-4567", companyAddress: "San Francisco, CA",
      clientName: agr.clients?.profiles?.full_name || "", clientCompany: agr.clients?.company || "", clientEmail: agr.clients?.profiles?.email || "",
      sections, notes: agr.content || undefined,
    };
    downloadPdf(pdfData);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agreements" description="Your service agreements" />

      {loading ? <TableSkeleton rows={3} /> : agreements.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyState title="No agreements" description="Agreements will appear here once created" icon={<FileSignature className="h-10 w-10" />} /></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {agreements.map((agr) => (
            <Card key={agr.id}>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50"><FileSignature className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{agr.title}</h3>
                      <p className="text-sm text-gray-500">Status: <Badge variant={agr.status === "active" ? "success" : "secondary"}>{agr.status}</Badge></p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(agr)}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
                </div>

                {/* Agreement Accepted */}
                {agr.accepted_at ? (
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Agreement Accepted ✓</p>
                      <p className="text-xs text-emerald-600">{formatDate(agr.accepted_at)}</p>
                    </div>
                  </div>
                ) : agr.status === "active" ? (
                  <div className="p-4 rounded-lg border border-gray-200 mb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 rounded border-gray-300" checked={acceptChecked[agr.id] || false} onChange={e => setAcceptChecked(p => ({ ...p, [agr.id]: e.target.checked }))} />
                      <span className="text-sm text-gray-700">I have read and agree to the project agreement.</span>
                    </label>
                    <Button size="sm" className="mt-3" disabled={!acceptChecked[agr.id] || accepting === agr.id} onClick={() => handleAccept(agr.id)}>
                      {accepting === agr.id ? <LoadingSpinner size="sm" /> : <><Shield className="h-3.5 w-3.5 mr-1" /> Accept Agreement</>}
                    </Button>
                  </div>
                ) : null}

                {/* Agreement Sections */}
                <div className="space-y-3">
                  {agr.scope_of_work && <div><p className="text-xs font-medium text-gray-500 uppercase">Scope of Work</p><p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{agr.scope_of_work}</p></div>}
                  {agr.deliverables && <div><p className="text-xs font-medium text-gray-500 uppercase">Deliverables</p><p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{agr.deliverables}</p></div>}
                  {agr.payment_terms && <div><p className="text-xs font-medium text-gray-500 uppercase">Payment Terms</p><p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{agr.payment_terms}</p></div>}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                  {agr.signed_date && <span>Signed: {formatDate(agr.signed_date)}</span>}
                  {agr.expiry_date && <span>Expires: {formatDate(agr.expiry_date)}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
