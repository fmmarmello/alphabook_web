import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Budget submission requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to submit budgets', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

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

    // ✅ VALIDATION: Check if budget can be submitted
    if (budget.status !== 'DRAFT') {
      return NextResponse.json({
        error: { message: "Apenas orçamentos em rascunho podem ser enviados para aprovação", details: null }
      }, { status: 400 });
    }

    // ✅ VALIDATION: Ensure budget has required client and center
    if (!budget.clientId || !budget.centerId) {
      return NextResponse.json({
        error: { message: "Orçamento deve ter cliente e centro de produção definidos", details: null }
      }, { status: 400 });
    }

    // Update budget status to SUBMITTED with timestamp
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: { 
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        client: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } }
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