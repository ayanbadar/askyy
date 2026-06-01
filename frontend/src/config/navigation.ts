import {
  Database,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Source", path: "/source", icon: Database },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Settings", path: "/settings", icon: Settings },
];
