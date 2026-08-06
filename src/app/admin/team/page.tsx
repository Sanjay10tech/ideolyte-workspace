"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Users2, MoreVertical, Edit, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getTeamMembers, createTeamMemberAction, updateTeamMemberAction, toggleTeamMemberStatus, type TeamMemberWithProfile } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMemberWithProfile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<{ id: string; status: string } | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getTeamMembers(); setMembers(d); } catch { toast.error("Failed to load team members"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);

    const form = e.currentTarget;
    const fullName = (form.elements.namedItem("full_name") as HTMLInputElement)?.value || "";
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value || "";
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value || "";
    const confirmPassword = (form.elements.namedItem("confirm_password") as HTMLInputElement)?.value || "";
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value || "";
    const jobRole = (form.elements.namedItem("job_role") as HTMLSelectElement)?.value || "Full Stack Developer";
    const status = (form.elements.namedItem("status") as HTMLSelectElement)?.value || "active";

    try {
      let result;
      if (editMember) {
        result = await updateTeamMemberAction(editMember.id, { full_name: fullName, phone, job_role: jobRole, status });
      } else {
        result = await createTeamMemberAction({ full_name: fullName, email, password, confirm_password: confirmPassword, phone, job_role: jobRole });
      }

      setFormLoading(false);

      if (result.error) {
        toast.error(result.error);
        console.error("Server action error:", result.error);
        return;
      }

      toast.success(editMember ? "Team member updated" : "Team member added successfully");
      setFormOpen(false);
      setEditMember(null);
      load();
    } catch (err) {
      setFormLoading(false);
      const msg = err instanceof Error ? err.message : "Unexpected error occurred";
      toast.error(msg);
      console.error("Team member action exception:", err);
    }
  }

  async function confirmToggle() {
    if (!toggleTarget) return;
    const result = await toggleTeamMemberStatus(toggleTarget.id, toggleTarget.status);
    if (result.error) { toast.error(result.error); } else { toast.success("Status updated"); load(); }
    setConfirmOpen(false); setToggleTarget(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Manage your team members">
        <Button size="sm" onClick={() => { setEditMember(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Member</Button>
      </PageHeader>

      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          {loading ? <TableSkeleton rows={5} /> : members.length === 0 ? (
            <EmptyState title="No team members" description="Add your first team member to get started" icon={<Users2 className="h-10 w-10" />} />
          ) : (
            <div className="overflow-visible">
              <table className="w-full min-w-[600px]">
                <thead><tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.profiles.full_name} size="sm" />
                          <div><p className="text-sm font-medium text-gray-900">{m.profiles.full_name}</p><p className="text-xs text-gray-500">{m.profiles.email}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><Badge variant="secondary">{m.job_role}</Badge></td>
                      <td className="px-5 py-4"><Badge variant={m.status === "active" ? "success" : "secondary"}>{m.status}</Badge></td>
                      <td className="px-5 py-4 text-sm text-gray-500">{formatDate(m.created_at)}</td>
                      <td className="px-5 py-4 text-right relative">
                        <button onClick={() => setActionMenuId(actionMenuId === m.id ? null : m.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><MoreVertical className="h-4 w-4" /></button>
                        {actionMenuId === m.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                            <div className="absolute right-5 top-12 z-20 w-40 rounded-lg border border-gray-100 bg-white shadow-lg py-1">
                              <button onClick={() => { setEditMember(m); setFormOpen(true); setActionMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit className="h-3.5 w-3.5" /> Edit</button>
                              <button onClick={() => { setToggleTarget({ id: m.id, status: m.status === "active" ? "inactive" : "active" }); setConfirmOpen(true); setActionMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                {m.status === "active" ? <><Ban className="h-3.5 w-3.5" /> Deactivate</> : <><CheckCircle className="h-3.5 w-3.5" /> Activate</>}
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditMember(null); }}>
        <DialogHeader onClose={() => { setFormOpen(false); setEditMember(null); }}>{editMember ? "Edit Team Member" : "Add Team Member"}</DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label><Input name="full_name" required defaultValue={editMember?.profiles.full_name || ""} /></div>
            {!editMember && (<>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label><Input name="email" type="email" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Temporary Password *</label><Input name="password" type="password" required minLength={6} placeholder="Min 6 characters" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label><Input name="confirm_password" type="password" required minLength={6} placeholder="Confirm password" /></div>
            </>)}
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label><Input name="phone" defaultValue={editMember?.profiles.phone || ""} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Job Role *</label>
              <Select name="job_role" required defaultValue={editMember?.job_role || "Full Stack Developer"}>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Tester">Tester</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Project Manager">Project Manager</option>
              </Select>
            </div>
            {editMember && (
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <Select name="status" defaultValue={editMember.status}><option value="active">Active</option><option value="inactive">Inactive</option></Select>
              </div>
            )}
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditMember(null); }}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : editMember ? "Save" : "Add Member"}</Button></DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmToggle} title="Change Status" description={`Are you sure you want to ${toggleTarget?.status === "active" ? "activate" : "deactivate"} this team member?`} confirmLabel="Confirm" />
    </div>
  );
}
