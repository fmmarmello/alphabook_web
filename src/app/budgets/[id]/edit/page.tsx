// src/app/budgets/[id]/edit/page.tsx - CORRIGIR IMPORTS

import { notFound } from 'next/navigation';
import { prisma } from "@/lib/prisma"; // ✅ CORRETO - destructured
import { getSpecifications } from "@/lib/specifications";
import EditBudgetForm from "./form";
import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute"; // ✅ ADICIONAR

interface EditBudgetPageProps {
  params: {
    id: string;
  };
}

async function getBudget(id: number) {
  if (isNaN(id) || id <= 0) {
    return null;
  }
  
  try {
    return await prisma.budget.findUnique({
      where: { id },
      include: { 
        order: true,
        client: true, // ✅ ADICIONAR
        center: true,  // ✅ ADICIONAR
        approvedBy: true,
        rejectedBy: true,
      },
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
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

  return (
    <AuthenticatedRoute>
      <EditBudgetForm budget={budget} specifications={specifications} />
    </AuthenticatedRoute>
  );
}
