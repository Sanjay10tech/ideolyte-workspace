"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getProjectMembers, getTeamMembers, assignTeamMemberToProject, removeTeamMemberFromProject, type ProjectMemberRow, type TeamMemberWithProfile } from "@/lib/actions/team";

interface ProjectTeamSectionProps {
  projectId: string;
}

export function ProjectTeamSection({ projectId }: ProjectTeamSectionProps) {
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [allTeam, setAllTeam] = useState<TeamMemberWithProfile[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ projectId: string; teamMemberId: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [pm, all] = await Promise.all([getProjectMembers(projectId), getTeamMembers()]);
    setMembers(pm);
    setAllTeam(all);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleAssign() {
    if (!selectedMember) return;
    setLoading(true);
    const member = allTeam.find(m => m.id === selectedMember);
    const result = await assignTeamMemberToProject(projectId, selectedMember, member?.job_role);
    setLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Team member assigned");
    setAssignOpen(false); setSelectedMember(""); load();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const result = await removeTeamMemberFromProject(removeTarget.projectId, removeTarget.teamMemberId);
    if (result.error) { toast.error(result.error); } else { toast.success("Removed from project"); load(); }
    setRemoveTarget(null);
  }

  // Filter out already assigned members
  const assignedIds = new Set(members.map(m => m.team_member_id));
  const available = allTeam.filter(m => !assignedIds.has(m.id) && m.status === "active");

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Users2 className="h-4 w-4" /> Project Team</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}><Plus className="h-3 w-3 mr-1" /> Assign Member</Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No team members assigned yet</p>
          ) : (
            <div className="space-y-3">
              {members.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar name={pm.team_members?.profiles?.full_name || ""} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pm.team_members?.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{pm.role_in_project || pm.team_members?.job_role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{pm.team_members?.job_role}</Badge>
                    <button onClick={() => setRemoveTarget({ projectId, teamMemberId: pm.team_member_id })} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogHeader onClose={() => setAssignOpen(false)}>Assign Team Member</DialogHeader>
        <DialogContent className="space-y-4">
          {available.length === 0 ? (
            <p className="text-sm text-gray-500">All active team members are already assigned to this project.</p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Team Member</label>
              <Select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
                <option value="">Choose...</option>
                {available.map(m => <option key={m.id} value={m.id}>{m.profiles.full_name} — {m.job_role}</option>)}
              </Select>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedMember || loading}>{loading ? "Assigning..." : "Assign"}</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog open={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove} title="Remove from Project" description="Remove this team member from the project? They will lose access to project data." confirmLabel="Remove" destructive />
    </>
  );
}
