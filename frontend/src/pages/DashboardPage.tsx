import { LoadingState } from "@/components/LoadingState";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { UserDashboardPage } from "@/pages/UserDashboardPage";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Loading dashboard…" className="py-16" />;
  }

  if (user?.is_superuser) {
    return <AdminDashboardPage />;
  }

  return <UserDashboardPage />;
}
