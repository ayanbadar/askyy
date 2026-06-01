import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard, getUserDashboard } from "@/api/dashboard";
import {
  adminDashboardQueryKey,
  userDashboardQueryKey,
} from "@/hooks/queryKeys";

export function useUserDashboardQuery() {
  return useQuery({
    queryKey: userDashboardQueryKey,
    queryFn: getUserDashboard,
  });
}

export function useAdminDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: getAdminDashboard,
    enabled,
  });
}
