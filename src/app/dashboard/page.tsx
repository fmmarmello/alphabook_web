import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Page() {
  return (
    <AuthenticatedRoute>
      <div className="space-y-6">
        <div className="flex h-16 items-center">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Dashboard />
      </div>
    </AuthenticatedRoute>
  );
}