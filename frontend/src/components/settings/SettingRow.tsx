import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type SettingRowProps = {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
};

export function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="space-y-1 sm:max-w-md">
        <Label htmlFor={htmlFor}>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="w-full sm:w-72 sm:shrink-0">{children}</div>
    </div>
  );
}
