import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-gray-500">
          You don&apos;t have permission to access this workspace. Please sign in with the correct account.
        </p>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-[#1e293b] text-white text-sm font-medium hover:bg-[#334155] transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
