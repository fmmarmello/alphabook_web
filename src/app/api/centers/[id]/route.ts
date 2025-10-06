import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { CenterSchema } from "@/lib/validation";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    await requireApiAuth(req);
    
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const center = await prisma.center.findUnique({ where: { id } });
    if (!center) {
      return NextResponse.json({
        error: { message: "Centro não encontrado", details: null }
      }, { status: 404 });
    }
    
    return NextResponse.json({
      data: center,
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
    
    // ✅ SECURITY: Center updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update centers', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const json = await req.json();
    const parsed = CenterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const exists = await prisma.center.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Centro não encontrado", details: null }
      }, { status: 404 });
    }
    
    const updated = await prisma.center.update({ where: { id }, data: parsed.data });
    
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
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Center partial updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update centers', 403);
    }

    const { id: paramId } = await ctx.params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const json = await req.json();
    const parsed = CenterSchema.partial().safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const exists = await prisma.center.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Centro não encontrado", details: null }
      }, { status: 404 });
    }
    
    const updated = await prisma.center.update({ where: { id }, data: parsed.data });
    
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
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Center deletion requires ADMIN role only
    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete centers', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const exists = await prisma.center.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Centro não encontrado", details: null }
      }, { status: 404 });
    }
    
    const inUse = await prisma.order.count({ where: { centerId: id } });
    if (inUse > 0) {
      return NextResponse.json({
        error: {
          message: "Centro possui ordens vinculadas e não pode ser removido",
          details: { orders: inUse }
        }
      }, { status: 409 });
    }
    
    const deleted = await prisma.center.delete({ where: { id } });
    
    return NextResponse.json({
      data: deleted,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
