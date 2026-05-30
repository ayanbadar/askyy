import { NavLink, Outlet } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 transition-colors",
    isActive
      ? "bg-accent font-medium text-accent-foreground"
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
  );

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="size-4" />
            </span>
            Askyy
          </NavLink>

          <nav
            className="flex items-center gap-1 text-sm"
            aria-label="Main navigation"
          >
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>

            {isAuthenticated && (
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
            )}

            <Separator orientation="vertical" className="mx-2 h-6" />

            {isAuthenticated ? (
              <>
                <span className="hidden max-w-[140px] truncate text-muted-foreground sm:inline">
                  {user?.name}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={logout}
                >
                  Log out
                </Button>
              </>
            ) : (
              <Button render={<NavLink to="/login" />} size="sm">
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Askyy
      </footer>
    </div>
  );
}
