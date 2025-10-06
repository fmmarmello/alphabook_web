import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { OrderStatusChangeSchema } from "@/lib/validation";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import { OrderStatus } from "@/generated/prisma";

// Order status state machine - defines valid transitions
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.IN_PRODUCTION, OrderStatus.ON_HOLD, OrderStatus.CANCELLED],
  [OrderStatus.IN_PRODUCTION]: [OrderStatus.COMPLETED, OrderStatus.ON_HOLD, OrderStatus.CANCELLED],
  [OrderStatus.ON_HOLD]: [OrderStatus.PENDING, OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED], // Allow cancellation even after completion for returns
  [OrderStatus.DELIVERED]: [], // Final state - no transitions allowed
  [OrderStatus.CANCELLED]: [], // Final state - no transitions allowed
};

// Permission requirements for specific status changes
const STATUS_CHANGE_PERMISSIONS: Record<OrderStatus, Role[]> = {
  [OrderStatus.PENDING]: [Role.USER, Role.MODERATOR, Role.ADMIN], // Any authenticated user
  [OrderStatus.IN_PRODUCTION]: [Role.MODERATOR, Role.ADMIN], // Moderator+ only
  [OrderStatus.COMPLETED]: [Role.MODERATOR, Role.ADMIN], // Moderator+ only
  [OrderStatus.DELIVERED]: [Role.MODERATOR, Role.ADMIN], // Moderator+ only
  [OrderStatus.ON_HOLD]: [Role.USER, Role.MODERATOR, Role.ADMIN], // Any authenticated user
  [OrderStatus.CANCELLED]: [Role.MODERATOR, Role.ADMIN], // Moderator+ only
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    const json = await req.json();
    const parsed = OrderStatusChangeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const { status: newStatus, reason } = parsed.data;
    
    // Fetch current order
    const currentOrder = await prisma.order.findUnique({ 
      where: { id },
      include: { client: true, center: true }
    });
    
    if (!currentOrder) {
      return NextResponse.json({
        error: { message: "Pedido não encontrado", details: null }
      }, { status: 404 });
    }

    const currentStatus = currentOrder.status;

    // Check if status change is needed
    if (currentStatus === newStatus) {
      return NextResponse.json({
        error: { 
          message: "Status já é o mesmo", 
          details: { currentStatus, requestedStatus: newStatus } 
        }
      }, { status: 400 });
    }

    // Validate status transition is allowed
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({
        error: { 
          message: "Transição de status inválida", 
          details: { 
            from: currentStatus, 
            to: newStatus, 
            allowedTransitions 
          } 
        }
      }, { status: 400 });
    }

    // Check permission for target status
    const requiredRoles = STATUS_CHANGE_PERMISSIONS[newStatus];
    if (!requiredRoles.includes(user.role)) {
      return NextResponse.json({
        error: { 
          message: "Permissão insuficiente para esta mudança de status", 
          details: { 
            requiredRoles, 
            userRole: user.role,
            targetStatus: newStatus 
          } 
        }
      }, { status: 403 });
    }

    // Prepare audit trail entry
    const timestamp = new Date().toISOString();
    const auditEntry = `[${timestamp}] Status alterado de ${currentStatus} para ${newStatus} por ${user.email}${reason ? ` - Motivo: ${reason}` : ''}`;
    
    // Update order status and add audit trail
    const updatedOrder = await prisma.order.update({ 
      where: { id },
      data: {
        status: newStatus,
        obs: currentOrder.obs ? `${currentOrder.obs}\n${auditEntry}` : auditEntry
      },
      include: { client: true, center: true }
    });

    // Apply role-based filtering to response data
    let filteredOrder;
    switch (user.role) {
      case Role.ADMIN:
        filteredOrder = updatedOrder;
        break;
        
      case Role.MODERATOR:
        filteredOrder = {
          ...updatedOrder,
          client: { id: updatedOrder.client.id, name: updatedOrder.client.name, email: updatedOrder.client.email },
          center: { id: updatedOrder.center.id, name: updatedOrder.center.name, type: updatedOrder.center.type }
        };
        break;
        
      case Role.USER:
        const { valorTotal, valorUnitario, ...safeOrder } = updatedOrder;
        void valorTotal; void valorUnitario;
        filteredOrder = {
          ...safeOrder,
          client: { id: updatedOrder.client.id, name: updatedOrder.client.name },
          center: { id: updatedOrder.center.id, name: updatedOrder.center.name }
        };
        break;
        
      default:
        throw new ApiAuthError('Invalid user role', 403);
    }
    
    return NextResponse.json({
      data: {
        ...filteredOrder,
        statusChange: {
          from: currentStatus,
          to: newStatus,
          changedBy: user.email,
          changedAt: timestamp,
          reason: reason || null
        }
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

// GET endpoint to retrieve valid status transitions for current order
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
    
    // Fetch current order
    const currentOrder = await prisma.order.findUnique({ 
      where: { id },
      select: { id: true, status: true }
    });
    
    if (!currentOrder) {
      return NextResponse.json({
        error: { message: "Pedido não encontrado", details: null }
      }, { status: 404 });
    }

    const currentStatus = currentOrder.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    
    // Filter transitions based on user permissions
    const availableTransitions = allowedTransitions.filter(status => {
      const requiredRoles = STATUS_CHANGE_PERMISSIONS[status];
      return requiredRoles.includes(user.role);
    });

    return NextResponse.json({
      data: {
        orderId: id,
        currentStatus,
        allowedTransitions,
        availableTransitions,
        userRole: user.role
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}