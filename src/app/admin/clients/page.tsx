"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, MoreVertical, Edit, Ban, CheckCircle, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientFormDialog } from "@/components/admin/client-form-dialog";
import { getClients, toggleClientStatus, type ClientWithProfile } from "@/lib/actions/clients";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientWithProfile | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<{ id: string; status: string } | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClients(search || undefined);
      setClients(data);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadClients, 300);
    return () => clearTimeout(timer);
  }, [loadClients]);

  function handleEdit(client: ClientWithProfile) {
    setEditClient(client);
    setFormOpen(true);
    setActionMenuId(null);
  }

  function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setToggleTarget({ id, status: newStatus });
    setConfirmOpen(true);
    setActionMenuId(null);
  }

  async function confirmToggle() {
    if (!toggleTarget) return;
    const result = await toggleClientStatus(toggleTarget.id, toggleTarget.status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Client ${toggleTarget.status === "active" ? "enabled" : "disabled"} successfully`);
      loadClients();
    }
    setConfirmOpen(false);
    setToggleTarget(null);
  }

  const statusVariant = (s: string) => {
    if (s === "active") return "success" as const;
    if (s === "inactive") return "secondary" as const;
    return "warning" as const;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Manage your client relationships">
        <Button size="sm" onClick={() => { setEditClient(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Client
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} />
          ) : clients.length === 0 ? (
            <EmptyState
              title="No clients found"
              description={search ? "Try a different search term" : "Add your first client to get started"}
              icon={<FolderKanban className="h-10 w-10" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={client.profiles.full_name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{client.profiles.full_name}</p>
                            <p className="text-xs text-gray-500">{client.profiles.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{client.company}</td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(client.status)}>
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{client.profiles.phone || "—"}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{formatDate(client.created_at)}</td>
                      <td className="px-5 py-4 text-right relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === client.id ? null : client.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {actionMenuId === client.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                            <div className="absolute right-5 top-12 z-20 w-40 rounded-lg border border-gray-100 bg-white shadow-lg py-1">
                              <button
                                onClick={() => handleEdit(client)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="h-3.5 w-3.5" /> Edit Client
                              </button>
                              <button
                                onClick={() => handleToggleStatus(client.id, client.status)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {client.status === "active" ? (
                                  <><Ban className="h-3.5 w-3.5" /> Disable</>
                                ) : (
                                  <><CheckCircle className="h-3.5 w-3.5" /> Enable</>
                                )}
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

      {/* Client Form Dialog */}
      <ClientFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditClient(null); }}
        client={editClient}
        onSuccess={loadClients}
      />

      {/* Confirm Toggle Status */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmToggle}
        title={toggleTarget?.status === "active" ? "Enable Client" : "Disable Client"}
        description={`Are you sure you want to ${toggleTarget?.status === "active" ? "enable" : "disable"} this client? They ${toggleTarget?.status === "inactive" ? "will lose" : "will regain"} portal access.`}
        confirmLabel={toggleTarget?.status === "active" ? "Enable" : "Disable"}
        destructive={toggleTarget?.status === "inactive"}
      />
    </div>
  );
}
