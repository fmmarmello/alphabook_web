"use client";

import { BudgetForm } from "@/components/forms/budget-form";
import type { Budget } from "@/types/models";
import type { Specifications } from "@/lib/specifications";

interface EditBudgetFormProps {
  budget: Budget;
  specifications: Specifications | null;
}

export default function EditBudgetForm({ budget, specifications }: EditBudgetFormProps) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
      <BudgetForm 
        mode="edit"
        initialData={budget}
        specifications={specifications || undefined}
      />
    </div>
  );
}