import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Budget approval requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to approve budgets', 403);
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

    // ✅ VALIDATION: Check if budget can be approved
    if (budget.status !== 'SUBMITTED') {
      return NextResponse.json({
        error: { message: "Apenas orçamentos enviados para aprovação podem ser aprovados", details: null }
      }, { status: 400 });
    }

    // ✅ VALIDATION: Ensure budget has required client and center
    if (!budget.clientId || !budget.centerId) {
      return NextResponse.json({
        error: { message: "Orçamento deve ter cliente e centro de produção definidos", details: null }
      }, { status: 400 });
    }

    // ✅ VALIDATION: Verify client and center still exist and are active
    const [client, center] = await Promise.all([
      prisma.client.findFirst({ 
        where: { id: budget.clientId, active: true },
        select: { id: true, name: true }
      }),
      prisma.center.findFirst({ 
        where: { id: budget.centerId, active: true },
        select: { id: true, name: true }
      })
    ]);

    if (!client) {
      return NextResponse.json({
        error: { message: "Cliente associado ao orçamento não foi encontrado ou está inativo", details: null }
      }, { status: 400 });
    }

    if (!center) {
      return NextResponse.json({
        error: { message: "Centro de produção associado ao orçamento não foi encontrado ou está inativo", details: null }
      }, { status: 400 });
    }

    // Update budget status to APPROVED with audit trail
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: user.userId,
        approved: true // Keep legacy field for compatibility
      },
      include: {
        client: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
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

