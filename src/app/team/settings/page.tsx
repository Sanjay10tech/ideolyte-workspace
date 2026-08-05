"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Info } from "lucide-react";

export default function TeamSettingsPage() {
  const { profile } = useAuth();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
    }).eq("id", profile?.id || "");
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Manage your account" />
      <Card>
        <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label><Input name="full_name" defaultValue={profile?.full_name || ""} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><Input defaultValue={profile?.email || ""} disabled className="bg-gray-50" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label><Input name="phone" defaultValue={profile?.phone || ""} /></div>
            <Button type="submit" size="sm">Save Changes</Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Password Management</p>
              <p className="text-sm text-gray-500 mt-1">Your password is managed by your workspace administrator. Contact your admin to reset your password.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
