"use client";
import { OrderForm } from "@/components/forms/order-form";
import {  useSearchParams } from 'next/navigation';
import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute";
import { redirect } from "next/navigation";

interface NewOrderPageProps {
  searchParams: Promise<{ budgetId?: string }>;
}

// src/app/orders/new/page.tsx - DEVE SER ATUALIZADO

export default function NewOrderPage() {
  const searchParams = useSearchParams();
  const budgetId = searchParams.get("budgetId");

  // ✅ ADICIONAR: Validação obrigatória
  if (!budgetId) {
    redirect('/budgets?status=APPROVED');
  }

  return (
    <AuthenticatedRoute>
      <OrderForm mode="create" budgetId={parseInt(budgetId)} />
    </AuthenticatedRoute>
  );
}
