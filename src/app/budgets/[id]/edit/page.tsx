import { BudgetForm } from "@/components/forms/budget-form";
import { notFound } from "next/navigation";
import type { Budget } from "@/types/models";
import { serverApiCall } from "@/lib/server-auth";

async function getBudget(id: string): Promise<Budget | null> {
  return await serverApiCall<Budget>(`/api/budgets/${id}`);
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