"use client";

import { BudgetForm } from "@/components/forms/budget-form";
import type { Specifications } from "@/lib/specifications";

interface NewBudgetFormProps {
  specifications: Specifications | null;
}

export default function NewBudgetForm({ specifications }: NewBudgetFormProps) {
  return (
    <BudgetForm 
      mode="create"
      specifications={specifications || undefined}
    />
  );
}