import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SettingsSelectProps = ComponentProps<"select"> & {
  options: { value: string; label: string }[];
};

export function SettingsSelect({
  options,
  className,
  ...props
}: SettingsSelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
