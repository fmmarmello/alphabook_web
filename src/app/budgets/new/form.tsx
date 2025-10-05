"use client";

import { useEffect, useState } from "react";
import { BudgetForm } from "@/components/forms/budget-form";
import { fetchSpecifications } from "@/lib/specifications";

export default function NewBudgetForm() {
  const [specifications, setSpecifications] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    const loadSpecifications = async () => {
      const specs = await fetchSpecifications();
      if (specs) {
        setSpecifications(specs as Record<string, string[]>);
      }
    };
    loadSpecifications();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
      <BudgetForm 
        mode="create"
        specifications={specifications || undefined}
      />
    </div>
  );
}
