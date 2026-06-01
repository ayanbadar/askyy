import { NavLink } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mainNavItems } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
  );

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <MessageSquare className="size-4" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Askyy</span>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 px-3"
        aria-label="Main navigation"
      >
        {mainNavItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={navLinkClass}>
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <Separator className="mb-4 bg-sidebar-border" />
        <div className="flex flex-col gap-3 px-1">
          <p className="truncate text-sm text-sidebar-foreground/70">
            {user?.name}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={logout}
          >
            Log out
          </Button>
        </div>
      </div>
    </aside>
  );
}
