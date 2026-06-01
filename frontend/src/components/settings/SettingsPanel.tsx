import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type SettingsPanelProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: ReactNode;
  onSave?: () => void;
  isSaving?: boolean;
  saved?: boolean;
  saveLabel?: string;
  hideSave?: boolean;
};

export function SettingsPanel({
  title,
  description,
  icon: Icon,
  children,
  onSave,
  isSaving = false,
  saved = false,
  saveLabel = "Save changes",
  hideSave = false,
}: SettingsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">{children}</div>
      </CardContent>
      {!hideSave && onSave && (
        <>
          <Separator />
          <CardFooter className="justify-end gap-3">
            {saved && (
              <span className="text-sm text-chart-4">Changes saved</span>
            )}
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving…" : saveLabel}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
