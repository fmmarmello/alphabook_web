
import { SecureRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <SecureRoute>
      <Dashboard />
    </SecureRoute>
  );
}
