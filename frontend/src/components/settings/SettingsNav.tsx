import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsSectionId =
  | "account"
  | "notifications"
  | "security"
  | "platform"
  | "danger";

export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

type SettingsNavProps = {
  items: SettingsNavItem[];
  activeId: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
};

export function SettingsNav({ items, activeId, onChange }: SettingsNavProps) {
  return (
    <nav
      className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="Settings sections"
    >
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = activeId === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              id === "danger" &&
                !isActive &&
                "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
              id === "danger" &&
                isActive &&
                "bg-destructive/10 text-destructive",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
