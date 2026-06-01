import { NavLink } from "react-router-dom";
import { Database, FileText, MessageSquare, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Start a chat",
    description: "Ask the AI assistant",
    path: "/chat",
    icon: MessageSquare,
  },
  {
    label: "Upload documents",
    description: "Add files to your knowledge base",
    path: "/documents",
    icon: FileText,
  },
  {
    label: "Manage sources",
    description: "Connect data sources",
    path: "/source",
    icon: Database,
  },
  {
    label: "Settings",
    description: "Update your preferences",
    path: "/settings",
    icon: Settings,
  },
];

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump to common tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map(({ label, description, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors",
              "hover:border-border hover:bg-muted/50",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">
                {description}
              </span>
            </span>
          </NavLink>
        ))}
      </CardContent>
    </Card>
  );
}
