import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { BudgetRejectSchema } from "@/lib/validation";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Budget rejection requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to reject budgets', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

    const json = await req.json();
    const parsed = BudgetRejectSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }

    const { reason } = parsed.data;

    const budget = await prisma.budget.findUnique({ 
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } }
      }
    });

    if (!budget) {
      return NextResponse.json({
        error: { message: "Orçamento não encontrado", details: null }
      }, { status: 404 });
    }

    // ✅ VALIDATION: Check if budget can be rejected
    if (budget.status !== 'SUBMITTED') {
      return NextResponse.json({
        error: { message: "Apenas orçamentos enviados para aprovação podem ser rejeitados", details: null }
      }, { status: 400 });
    }

    // Update budget status to REJECTED with audit trail
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: user.userId,
        observacoes: budget.observacoes 
          ? `${budget.observacoes}\n\nRejeitado em ${new Date().toLocaleDateString('pt-BR')}: ${reason}`
          : `Rejeitado em ${new Date().toLocaleDateString('pt-BR')}: ${reason}`
      },
      include: {
        client: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      data: updatedBudget,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}