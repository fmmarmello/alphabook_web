import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatusChangeSchema } from '@/lib/validation';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import { OrderStatus, Prisma } from '@/generated/prisma';

const ORDER_WITH_RELATIONS = {
  budget: {
    include: {
      client: true,
      center: true,
    },
  },
} satisfies Prisma.OrderInclude;

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.IN_PRODUCTION,
    OrderStatus.ON_HOLD,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_PRODUCTION]: [
    OrderStatus.COMPLETED,
    OrderStatus.ON_HOLD,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ON_HOLD]: [
    OrderStatus.PENDING,
    OrderStatus.IN_PRODUCTION,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.COMPLETED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const STATUS_CHANGE_PERMISSIONS: Record<OrderStatus, Role[]> = {
  [OrderStatus.PENDING]: [Role.USER, Role.MODERATOR, Role.ADMIN],
  [OrderStatus.IN_PRODUCTION]: [Role.MODERATOR, Role.ADMIN],
  [OrderStatus.COMPLETED]: [Role.MODERATOR, Role.ADMIN],
  [OrderStatus.DELIVERED]: [Role.MODERATOR, Role.ADMIN],
  [OrderStatus.ON_HOLD]: [Role.USER, Role.MODERATOR, Role.ADMIN],
  [OrderStatus.CANCELLED]: [Role.MODERATOR, Role.ADMIN],
};

type OrderWithBudget = Prisma.OrderGetPayload<{ include: typeof ORDER_WITH_RELATIONS }>;

function sanitizeOrderByRole(order: OrderWithBudget, role: Role) {
  if (role === Role.ADMIN) {
    return order;
  }

  const budget = order.budget;
  if (!budget) {
    return order;
  }

  if (role === Role.MODERATOR) {
    return {
      ...order,
      budget: {
        ...budget,
        client: budget.client
          ? {
              id: budget.client.id,
              name: budget.client.name,
              email: budget.client.email,
              phone: budget.client.phone,
            }
          : null,
        center: budget.center
          ? {
              id: budget.center.id,
              name: budget.center.name,
              type: budget.center.type,
            }
          : null,
      },
    };
  }

  const {
    preco_total: _ignorePrecoTotal,
    preco_unitario: _ignorePrecoUnitario,
    ...restBudget
  } = budget;
  return {
    ...order,
    budget: {
      ...restBudget,
      client: budget.client
        ? {
            id: budget.client.id,
            name: budget.client.name,
          }
        : null,
      center: budget.center
        ? {
            id: budget.center.id,
            name: budget.center.name,
          }
        : null,
    },
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiAuth(req);

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: { message: 'ID invalido', details: null } },
        { status: 400 }
      );
    }

    const json = await req.json();
    const parsed = OrderStatusChangeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Dados invalidos',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { status: newStatus, reason } = parsed.data;
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: ORDER_WITH_RELATIONS,
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: { message: 'Ordem nao encontrada', details: null } },
        { status: 404 }
      );
    }

    const currentStatus = currentOrder.status;

    if (currentStatus === newStatus) {
      return NextResponse.json(
        {
          error: {
            message: 'Status ja esta definido',
            details: { currentStatus, requestedStatus: newStatus },
          },
        },
        { status: 400 }
      );
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: {
            message: 'Transicao de status invalida',
            details: {
              from: currentStatus,
              to: newStatus,
              allowedTransitions,
            },
          },
        },
        { status: 400 }
      );
    }

    const requiredRoles = STATUS_CHANGE_PERMISSIONS[newStatus];
    if (!requiredRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: {
            message: 'Permissao insuficiente para esta mudanca de status',
            details: {
              requiredRoles,
              userRole: user.role,
              targetStatus: newStatus,
            },
          },
        },
        { status: 403 }
      );
    }

    const timestamp = new Date().toISOString();
    const auditEntry = `[${timestamp}] Status alterado de ${currentStatus} para ${newStatus} por ${user.email}${
      reason ? ` - Motivo: ${reason}` : ''
    }`;
    const existingNotes = currentOrder.obs_producao ?? '';
    const mergedNotes = existingNotes
      ? `${existingNotes}\n${auditEntry}`
      : auditEntry;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
        obs_producao: mergedNotes,
      },
      include: ORDER_WITH_RELATIONS,
    });

    const filteredOrder = sanitizeOrderByRole(updatedOrder, user.role);

    return NextResponse.json({
      data: {
        ...filteredOrder,
        statusChange: {
          from: currentStatus,
          to: newStatus,
          changedBy: user.email,
          changedAt: timestamp,
          reason: reason || null,
        },
      },
      error: null,
    });
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiAuth(req);

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: { message: 'ID invalido', details: null } },
        { status: 400 }
      );
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: { message: 'Ordem nao encontrada', details: null } },
        { status: 404 }
      );
    }

    const currentStatus = currentOrder.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    const availableTransitions = allowedTransitions.filter((status) => {
      const requiredRoles = STATUS_CHANGE_PERMISSIONS[status];
      return requiredRoles.includes(user.role);
    });

    return NextResponse.json({
      data: {
        orderId: id,
        currentStatus,
        allowedTransitions,
        availableTransitions,
        userRole: user.role,
      },
      error: null,
    });
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
