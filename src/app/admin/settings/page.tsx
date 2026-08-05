"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { changePassword } from "@/lib/auth/password";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [pwLoading, setPwLoading] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
    }).eq("id", profile?.id || "");
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);
    setPwLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Password changed successfully");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label><Input name="full_name" defaultValue={profile?.full_name || ""} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><Input defaultValue={profile?.email || ""} disabled className="bg-gray-50" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label><Input name="phone" defaultValue={profile?.phone || ""} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label><Input name="company" defaultValue={profile?.company || ""} /></div>
            </div>
            <Button type="submit" size="sm">Save Changes</Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label><Input name="new_password" type="password" required minLength={6} placeholder="Min 6 characters" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label><Input name="confirm_password" type="password" required minLength={6} placeholder="Confirm new password" /></div>
            </div>
            <Button type="submit" size="sm" disabled={pwLoading}>{pwLoading ? <LoadingSpinner size="sm" /> : "Update Password"}</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
