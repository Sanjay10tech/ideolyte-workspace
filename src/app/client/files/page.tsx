"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, FileText, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getClientFiles, type ProjectFile } from "@/lib/actions/files";
import { formatDate } from "@/lib/utils";

export default function ClientFilesPage() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getClientFiles(); setFiles(d); } catch { toast.error("Failed to load files"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Files" description="Documents and files shared with you" />

      {loading ? <TableSkeleton rows={4} /> : files.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyState title="No files yet" description="Files shared with you will appear here" icon={<FolderOpen className="h-10 w-10" />} /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50"><FileText className="h-5 w-5 text-gray-500" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{file.projects?.name || ""}</Badge>
                      <span className="text-xs text-gray-400">{formatSize(file.file_size)}</span>
                      <span className="text-xs text-gray-400">· {formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </div>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
