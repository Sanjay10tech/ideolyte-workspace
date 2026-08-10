"use client";

import { useEffect, useState, useCallback } from "react";
import { Upload, FileText, Trash2, Download, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getProjectFiles, deleteFileAction, type ProjectFile } from "@/lib/actions/files";
import { getProjects, type ProjectWithClient } from "@/lib/actions/projects";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); const [f, p] = await Promise.all([getProjectFiles(), getProjects()]); setFiles(f); setProjects(p); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const projectId = (form.elements.namedItem("project_id") as HTMLSelectElement)?.value;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const category = (form.elements.namedItem("category") as HTMLInputElement)?.value || null;
    const file = fileInput?.files?.[0];

    if (!file || !projectId) {
      toast.error("Please select a project and file");
      setUploading(false);
      return;
    }

    try {
      // Upload directly to Supabase Storage from browser (bypasses Vercel 4.5MB limit)
      const { createClient: createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();
      const filePath = `${projectId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath);

      // Save file metadata via server action (small payload)
      const { saveFileMetadata } = await import("@/lib/actions/files");
      const result = await saveFileMetadata({
        project_id: projectId,
        name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
        category,
      });

      setUploading(false);
      if (result.error) { toast.error(result.error); return; }
      toast.success("File uploaded successfully");
      setUploadOpen(false); load();
    } catch (err) {
      setUploading(false);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const pathParts = deleteTarget.file_url.split("/project-files/");
    const filePath = pathParts[1] || "";
    const result = await deleteFileAction(deleteTarget.id, filePath);
    if (result.error) { toast.error(result.error); } else { toast.success("File deleted"); load(); }
    setDeleteTarget(null);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Project files and documents">
        <Button size="sm" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4 mr-1" /> Upload</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={5} /> : files.length === 0 ? (
            <EmptyState title="No files yet" description="Upload files to your projects" icon={<FolderOpen className="h-10 w-10" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
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
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button></a>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => setDeleteTarget(file)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <DialogHeader onClose={() => setUploadOpen(false)}>Upload File</DialogHeader>
        <form onSubmit={handleUpload}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Project *</label>
              <Select name="project_id" required><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">File *</label><Input name="file" type="file" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label><Input name="category" placeholder="e.g. design, document, deliverable" /></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button type="submit" disabled={uploading}>{uploading ? <LoadingSpinner size="sm" /> : "Upload"}</Button></DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete File" description="Are you sure you want to delete this file? This cannot be undone." confirmLabel="Delete" destructive />
    </div>
  );
}
