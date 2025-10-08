import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import { Prisma } from '@/generated/prisma';

const ORDER_WITH_RELATIONS = {
  budget: {
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      center: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiAuth(req);

    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get('limit') ?? '5', 10);

    const recentOrders = await prisma.order.findMany({
      take: Number.isNaN(limit) || limit <= 0 ? 5 : limit,
      orderBy: {
        data_pedido: 'desc',
      },
      include: ORDER_WITH_RELATIONS,
    });

    const data = recentOrders.map((order) => {
      const budget = order.budget;

      const basePayload = {
        id: order.id,
        numero_pedido: order.numero_pedido,
        status: order.status,
        data_pedido: order.data_pedido,
        budget: budget
          ? {
              id: budget.id,
              titulo: budget.titulo,
              preco_total: budget.preco_total,
              preco_unitario: budget.preco_unitario,
              client: budget.client,
              center: budget.center,
              status: budget.status,
              data_entrega: budget.data_entrega,
            }
          : null,
      };

      if (user.role === Role.ADMIN || user.role === Role.MODERATOR) {
        return basePayload;
      }

      if (!basePayload.budget) {
        return basePayload;
      }

      const {
        preco_total: _ignorePrecoTotal,
        preco_unitario: _ignorePrecoUnitario,
        ...safeBudget
      } = basePayload.budget;
      return {
        ...basePayload,
        budget: safeBudget,
      };
    });

    return NextResponse.json({
      data,
      error: null,
    });
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
