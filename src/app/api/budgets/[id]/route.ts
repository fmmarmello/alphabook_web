import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { BudgetSchema } from "@/lib/validation";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    const id = Number(params.id);
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Budget updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update budgets', 403);
    }

    const id = Number(params.id);
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

    const budget = await prisma.budget.update({
      where: { id },
      data: parsed.data,
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Budget deletion requires ADMIN role only
    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete budgets', 403);
    }

    const id = Number(params.id);
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
