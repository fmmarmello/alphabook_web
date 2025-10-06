import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { OrderSchema } from "@/lib/validation";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import { OrderStatus } from "@/generated/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    const { id: paramId } = await params;
    const id = Number(paramId);
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
        void valorTotal; void valorUnitario;
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Order updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update orders', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
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
    
    const currentOrder = await prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      return NextResponse.json({
        error: { message: "Pedido não encontrado", details: null }
      }, { status: 404 });
    }

    // ✅ SECURITY: Prevent changes to budgetId and orderType after creation
    if (parsed.data.budgetId && parsed.data.budgetId !== currentOrder.budgetId) {
      return NextResponse.json({
        error: { 
          message: "Não é possível alterar o orçamento vinculado após a criação do pedido", 
          details: { currentBudgetId: currentOrder.budgetId, attemptedBudgetId: parsed.data.budgetId } 
        }
      }, { status: 400 });
    }

    if (parsed.data.orderType && parsed.data.orderType !== currentOrder.orderType) {
      return NextResponse.json({
        error: { 
          message: "Não é possível alterar o tipo do pedido após a criação", 
          details: { currentOrderType: currentOrder.orderType, attemptedOrderType: parsed.data.orderType } 
        }
      }, { status: 400 });
    }

    // ✅ SECURITY: Status changes should use the dedicated status API
    if (parsed.data.status && parsed.data.status !== currentOrder.status) {
      return NextResponse.json({
        error: { 
          message: "Use a API dedicada para mudanças de status: PATCH /api/orders/:id/status", 
          details: { statusEndpoint: `/api/orders/${id}/status` } 
        }
      }, { status: 400 });
    }

    // Validate client and center if they are being changed
    const [client, center] = await Promise.all([
      parsed.data.clientId ? prisma.client.findUnique({ where: { id: parsed.data.clientId } }) : null,
      parsed.data.centerId ? prisma.center.findUnique({ where: { id: parsed.data.centerId } }) : null,
    ]);
    
    if (parsed.data.clientId && !client) {
      return NextResponse.json({
        error: {
          message: "Cliente não encontrado",
          details: { clientId: parsed.data.clientId }
        }
      }, { status: 400 });
    }

    if (parsed.data.clientId && client && !client.active) {
      return NextResponse.json({
        error: {
          message: "Cliente não está ativo",
          details: { clientId: parsed.data.clientId }
        }
      }, { status: 400 });
    }
    
    if (parsed.data.centerId && !center) {
      return NextResponse.json({
        error: {
          message: "Centro de produção não encontrado",
          details: { centerId: parsed.data.centerId }
        }
      }, { status: 400 });
    }

    if (parsed.data.centerId && center && !center.active) {
      return NextResponse.json({
        error: {
          message: "Centro de produção não está ativo",
          details: { centerId: parsed.data.centerId }
        }
      }, { status: 400 });
    }
    
    // Prepare update data, excluding protected fields
    const { budgetId: _budgetId, orderType: _orderType, status: _status, ...updateData } = parsed.data;
    void _budgetId; void _orderType; void _status; // Suppress unused variable warnings

    // Add audit trail for significant changes
    const timestamp = new Date().toISOString();
    const auditEntry = `[${timestamp}] Pedido atualizado por ${user.email}`;
    const newObs = currentOrder.obs ? `${currentOrder.obs}\n${auditEntry}` : auditEntry;
    
    const updated = await prisma.order.update({ 
      where: { id }, 
      data: {
        ...updateData,
        obs: newObs
      }
    });
    
    return NextResponse.json({
      data: updated,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Order partial updates require MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update orders', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
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
    
    const currentOrder = await prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      return NextResponse.json({
        error: { message: "Pedido não encontrado", details: null }
      }, { status: 404 });
    }

    // ✅ SECURITY: Prevent changes to budgetId and orderType after creation
    if (parsed.data.budgetId !== undefined && parsed.data.budgetId !== currentOrder.budgetId) {
      return NextResponse.json({
        error: { 
          message: "Não é possível alterar o orçamento vinculado após a criação do pedido", 
          details: { currentBudgetId: currentOrder.budgetId, attemptedBudgetId: parsed.data.budgetId } 
        }
      }, { status: 400 });
    }

    if (parsed.data.orderType !== undefined && parsed.data.orderType !== currentOrder.orderType) {
      return NextResponse.json({
        error: { 
          message: "Não é possível alterar o tipo do pedido após a criação", 
          details: { currentOrderType: currentOrder.orderType, attemptedOrderType: parsed.data.orderType } 
        }
      }, { status: 400 });
    }

    // ✅ SECURITY: Status changes should use the dedicated status API
    if (parsed.data.status !== undefined && parsed.data.status !== currentOrder.status) {
      return NextResponse.json({
        error: { 
          message: "Use a API dedicada para mudanças de status: PATCH /api/orders/:id/status", 
          details: { statusEndpoint: `/api/orders/${id}/status` } 
        }
      }, { status: 400 });
    }

    // Validate client and center if they are being changed
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

      if (!client.active) {
        return NextResponse.json({
          error: {
            message: "Cliente não está ativo",
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

      if (!center.active) {
        return NextResponse.json({
          error: {
            message: "Centro de produção não está ativo",
            details: { centerId: parsed.data.centerId }
          }
        }, { status: 400 });
      }
    }

    // Prepare update data, excluding protected fields
    const { budgetId: _budgetId, orderType: _orderType, status: _status, ...updateData } = parsed.data;
    void _budgetId; void _orderType; void _status; // Suppress unused variable warnings

    // Add audit trail for significant changes
    const timestamp = new Date().toISOString();
    const auditEntry = `[${timestamp}] Pedido parcialmente atualizado por ${user.email}`;
    const newObs = currentOrder.obs ? `${currentOrder.obs}\n${auditEntry}` : auditEntry;

    const updated = await prisma.order.update({ 
      where: { id }, 
      data: {
        ...updateData,
        obs: newObs
      }
    });
    
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
    
    // ✅ SECURITY: Order deletion requires ADMIN role only
    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete orders', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
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
