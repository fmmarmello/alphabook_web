"use client";

import { useEffect, useState } from "react";
import { BudgetForm } from "@/components/forms/budget-form";
import { fetchSpecifications } from "@/lib/specifications";
import type { Budget } from "@/types/models";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";

interface EditBudgetFormProps {
  budgetId: string;
}

export default function EditBudgetForm({ budgetId }: EditBudgetFormProps) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [specifications, setSpecifications] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load budget and specifications in parallel
        const [budgetResponse, specs] = await Promise.all([
          fetch(`/api/budgets/${budgetId}`),
          fetchSpecifications()
        ]);

        if (!budgetResponse.ok) {
          throw new Error('Budget not found');
        }

        const budgetData = await budgetResponse.json();
        setBudget(budgetData.data);
        
        if (specs) {
          setSpecifications(specs as Record<string, string[]>);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading budget');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [budgetId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl w-full space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl w-full">
          <ErrorAlert message={error} />
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl w-full">
          <ErrorAlert message="Budget not found" />
        </div>
      </div>
    );
  }

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
