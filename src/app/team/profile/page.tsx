"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";

export default function TeamProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Profile" description="Your team member profile" />
      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={profile?.full_name || "TM"} size="lg" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{profile?.full_name}</p>
              <p className="text-sm text-gray-500">Team Member</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-gray-500 uppercase font-medium">Email</p><p className="text-sm text-gray-900 mt-0.5">{profile?.email || "—"}</p></div>
            <div><p className="text-xs text-gray-500 uppercase font-medium">Phone</p><p className="text-sm text-gray-900 mt-0.5">{profile?.phone || "—"}</p></div>
            <div><p className="text-xs text-gray-500 uppercase font-medium">Role</p><p className="text-sm text-gray-900 mt-0.5">Team Member</p></div>
            <div><p className="text-xs text-gray-500 uppercase font-medium">Joined</p><p className="text-sm text-gray-900 mt-0.5">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
