import { BudgetForm } from "@/components/forms/budget-form";
import { notFound } from "next/navigation";
import type { Budget } from "@/types/models";

async function getBudget(id: string): Promise<Budget | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/budgets/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const budget = await getBudget(id);
  
  if (!budget) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BudgetForm mode="edit" initialData={budget} />
    </div>
  );
}