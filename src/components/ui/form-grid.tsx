import * as React from "react";
import { cn } from "@/lib/utils";

interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ className, children, columns = 2, gap = "md", ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    const gridGap = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridCols[columns],
          gridGap[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormGrid.displayName = "FormGrid";

interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("contents", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormRow.displayName = "FormRow";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormGrid, FormRow, FormField };