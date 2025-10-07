
import { notFound } from 'next/navigation';
import prisma from "@/lib/prisma";
import { getSpecifications } from "@/lib/specifications";
import EditBudgetForm from "./form";

interface EditBudgetPageProps {
  params: {
    id: string;
  };
}

async function getBudget(id: number) {
  if (isNaN(id) || id <= 0) {
    return null;
  }
  return await prisma.budget.findUnique({
    where: { id },
    include: { order: true }, // Include related order data as in the original form
  });
}

export default async function EditBudgetPage({ params }: EditBudgetPageProps) {
  const budgetId = Number(params.id);

  const [budget, specifications] = await Promise.all([
    getBudget(budgetId),
    getSpecifications(),
  ]);

  if (!budget) {
    notFound();
  }

  return <EditBudgetForm budget={budget} specifications={specifications} />;
}
