import { NavLink, Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Layout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isAuthenticated && <AppSidebar />}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {!isAuthenticated && (
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-end px-6 py-3">
              <Button render={<NavLink to="/login" />} size="sm">
                Sign in
              </Button>
            </div>
          </header>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
