"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClientAction, updateClientAction, type ClientWithProfile } from "@/lib/actions/clients";

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithProfile | null;
  onSuccess: () => void;
}

export function ClientFormDialog({ open, onClose, client, onSuccess }: ClientFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!client;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    let result;
    if (isEdit) {
      result = await updateClientAction(client.id, formData);
    } else {
      result = await createClientAction(formData);
    }

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEdit ? "Client updated successfully" : "Client created successfully");
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader onClose={onClose}>{isEdit ? "Edit Client" : "Add New Client"}</DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <Input
              name="full_name"
              required
              defaultValue={client?.profiles.full_name || ""}
              placeholder="John Doe"
            />
          </div>
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <Input name="email" type="email" required placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Temporary Password *</label>
                <Input name="password" type="password" required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                <Input name="confirm_password" type="password" required minLength={6} placeholder="Confirm password" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company *</label>
            <Input
              name="company"
              required
              defaultValue={client?.company || ""}
              placeholder="Company Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <Input
              name="phone"
              defaultValue={client?.profiles.phone || ""}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <Input
              name="address"
              defaultValue={client?.address || ""}
              placeholder="123 Main St, City, State"
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <Select name="status" defaultValue={client?.status || "active"}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </Select>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : isEdit ? "Save Changes" : "Create Client"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
