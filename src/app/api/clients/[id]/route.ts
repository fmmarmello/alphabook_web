import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { ClientSchema } from "@/lib/validation";
import { getAuthenticatedUser, handleApiError, ApiAuthError, getFieldSelection } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    // ✅ SECURITY: Role-based field filtering
    const select = getFieldSelection(user, 'client');
    
    const client = await prisma.client.findUnique({
      where: { id },
      select
    });
    
    if (!client) {
      return NextResponse.json({
        error: { message: "Cliente não encontrado", details: null }
      }, { status: 404 });
    }
    
    return NextResponse.json({
      data: client,
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
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Client updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update clients', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const json = await req.json();
    const parsed = ClientSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Cliente não encontrado", details: null }
      }, { status: 404 });
    }
    
    const updated = await prisma.client.update({ where: { id }, data: parsed.data });
    
    return NextResponse.json({
      data: updated,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Client partial updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update clients', 403);
    }

    const { id: paramId } = await ctx.params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const json = await req.json();
    const parsed = ClientSchema.partial().safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Cliente não encontrado", details: null }
      }, { status: 404 });
    }
    
    const updated = await prisma.client.update({ where: { id }, data: parsed.data });
    
    return NextResponse.json({
      data: updated,
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
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Client deletion requires ADMIN role only
    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete clients', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Cliente não encontrado", details: null }
      }, { status: 404 });
    }
    
    const inUse = await prisma.order.count({
      where: { budget: { clientId: id } },
    });
    if (inUse > 0) {
      return NextResponse.json({
        error: {
          message: "Cliente possui ordens vinculadas e não pode ser removido",
          details: { orders: inUse }
        }
      }, { status: 409 });
    }
    
    const deleted = await prisma.client.delete({ where: { id } });
    
    return NextResponse.json({
      data: deleted,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
