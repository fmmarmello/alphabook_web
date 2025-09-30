import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { OrderSchema } from "@/lib/validation";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: { client: true, center: true }
    });
    
    if (!order) {
      return NextResponse.json({
        error: { message: "Ordem não encontrada", details: null }
      }, { status: 404 });
    }

    // ✅ SECURITY: Role-based data filtering for individual orders
    let filteredOrder;
    switch (user.role) {
      case Role.ADMIN:
        // Admins see all data
        filteredOrder = order;
        break;
        
      case Role.MODERATOR:
        // Moderators see all data including financial info
        filteredOrder = {
          ...order,
          client: { id: order.client.id, name: order.client.name, email: order.client.email },
          center: { id: order.center.id, name: order.center.name, type: order.center.type }
        };
        break;
        
      case Role.USER:
        // Users DO NOT see financial data
        const { valorTotal, valorUnitario, ...safeOrder } = order;
        filteredOrder = {
          ...safeOrder,
          client: { id: order.client.id, name: order.client.name },
          center: { id: order.center.id, name: order.center.name }
        };
        break;
        
      default:
        throw new ApiAuthError('Invalid user role', 403);
    }

    return NextResponse.json({
      data: filteredOrder,
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
    
    // ✅ SECURITY: Order updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update orders', 403);
    }

    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const json = await req.json();
    const parsed = OrderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Ordem não encontrada", details: null }
      }, { status: 404 });
    }
    
    const [client, center] = await Promise.all([
      prisma.client.findUnique({ where: { id: parsed.data.clientId } }),
      prisma.center.findUnique({ where: { id: parsed.data.centerId } }),
    ]);
    
    if (!client) {
      return NextResponse.json({
        error: {
          message: "Cliente não encontrado",
          details: { clientId: parsed.data.clientId }
        }
      }, { status: 400 });
    }
    
    if (!center) {
      return NextResponse.json({
        error: {
          message: "Centro de produção não encontrado",
          details: { centerId: parsed.data.centerId }
        }
      }, { status: 400 });
    }
    
    const updated = await prisma.order.update({ where: { id }, data: parsed.data });
    
    return NextResponse.json({
      data: updated,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Order partial updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update orders', 403);
    }

    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const json = await req.json();
    const parsed = OrderSchema.partial().safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Ordem não encontrada", details: null }
      }, { status: 404 });
    }

    if (parsed.data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
      if (!client) {
        return NextResponse.json({
          error: {
            message: "Cliente não encontrado",
            details: { clientId: parsed.data.clientId }
          }
        }, { status: 400 });
      }
    }
    
    if (parsed.data.centerId) {
      const center = await prisma.center.findUnique({ where: { id: parsed.data.centerId } });
      if (!center) {
        return NextResponse.json({
          error: {
            message: "Centro de produção não encontrado",
            details: { centerId: parsed.data.centerId }
          }
        }, { status: 400 });
      }
    }

    const updated = await prisma.order.update({ where: { id }, data: parsed.data });
    
    return NextResponse.json({
      data: updated,
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
    
    // ✅ SECURITY: Order deletion requires ADMIN role only
    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete orders', 403);
    }

    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }
    
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({
        error: { message: "Ordem não encontrada", details: null }
      }, { status: 404 });
    }
    
    const deleted = await prisma.order.delete({ where: { id } });
    
    return NextResponse.json({
      data: deleted,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

