import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { BudgetSchema } from "@/lib/validation";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    await requireApiAuth(req);
    
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

    const budget = await prisma.budget.findUnique({
      where: { id },
    });
    if (!budget) {
      return NextResponse.json({
        error: { message: "Orçamento não encontrado", details: null }
      }, { status: 404 });
    }

    return NextResponse.json({
      data: budget,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Budget updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update budgets', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

    const json = await req.json();
    const parsed = BudgetSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }

    const existingBudget = await prisma.budget.findUnique({ where: { id } });
    if (!existingBudget) {
      return NextResponse.json({
        error: { message: "Orçamento não encontrado", details: null }
      }, { status: 404 });
    }

      // Convert date strings to DateTime objects for Prisma
    const updateData = {
      ...parsed.data,
      data_pedido: parsed.data.data_pedido ? new Date(parsed.data.data_pedido) : undefined,
      data_entrega: parsed.data.data_entrega ? new Date(parsed.data.data_entrega) : undefined,
    };

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({
      data: budget,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Budget deletion requires ADMIN role only
    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete budgets', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) {
      return NextResponse.json({
        error: { message: "Orçamento não encontrado", details: null }
      }, { status: 404 });
    }

    await prisma.budget.delete({ where: { id } });
    
    return NextResponse.json({
      data: { deleted: true },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
