"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ToolbarProps = React.ComponentProps<"div">;

function Toolbar({ className, ...props }: ToolbarProps) {
  return (
    <div
      data-slot="toolbar"
      className={cn(
        "flex flex-wrap items-end gap-2 border-b pb-3 mb-4",
        className
      )}
      {...props}
    />
  );
}

function ToolbarSpacer() {
  return <div className="flex-1 min-w-[8px]" />;
}

function ToolbarSection({ className, ...props }: ToolbarProps) {
  return (
    <div
      data-slot="toolbar-section"
      className={cn("flex flex-wrap items-end gap-2", className)}
      {...props}
    />
  );
}

export { Toolbar, ToolbarSpacer, ToolbarSection };

