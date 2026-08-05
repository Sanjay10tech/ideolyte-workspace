"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, FileText, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type PFile = { id: string; name: string; file_url: string; file_size: number; created_at: string; projects: { name: string } };

export default function TeamFilesPage() {
  const [files, setFiles] = useState<PFile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const supabase = createClient(); const { data } = await supabase.from("project_files").select("*, projects(name)").order("created_at", { ascending: false }); setFiles((data || []) as unknown as PFile[]); } catch { toast.error("Failed"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function formatSize(b: number) { if (b < 1024) return `${b} B`; if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`; return `${(b / 1048576).toFixed(1)} MB`; }

  return (
    <div className="space-y-6">
      <PageHeader title="Files" description="Project files from your assignments" />
      {loading ? <TableSkeleton rows={4} /> : files.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyState title="No files" description="Files will appear from your assigned projects" icon={<FolderOpen className="h-10 w-10" />} /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {files.map(f => (
            <Card key={f.id}><CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50"><FileText className="h-5 w-5 text-gray-500" /></div>
                <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{f.name}</p><div className="flex items-center gap-2 mt-0.5"><Badge variant="secondary" className="text-[10px]">{f.projects?.name}</Badge><span className="text-xs text-gray-400">{formatSize(f.file_size)} · {formatDate(f.created_at)}</span></div></div>
              </div>
              <a href={f.file_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button></a>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
