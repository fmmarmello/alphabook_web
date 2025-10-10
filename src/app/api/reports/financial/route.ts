import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import type { Prisma } from "@/generated/prisma";

const FilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  editorial: z.string().optional(),
  centerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Financial reports are ADMIN/MODERATOR only
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to access financial reports', 403);
    }

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = FilterSchema.safeParse(query);
    if (!validation.success) {
      return NextResponse.json({
        error: { message: 'Invalid query parameters', details: validation.error.flatten() }
      }, { status: 400 });
    }

    const { dateFrom, dateTo, editorial, centerId } = validation.data;

    const where: Prisma.BudgetWhereInput = {
      order: {
        isNot: null,
      },
    };
    const dateFilter: Prisma.DateTimeFilter<'Budget'> = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }
    if (Object.keys(dateFilter).length) {
      where.data_entrega = dateFilter;
    }
    if (editorial && editorial !== 'all') {
      where.editorial = { contains: editorial };
    }
    if (centerId && centerId !== 'all') {
      where.centerId = parseInt(centerId, 10);
    }

    const budgets = await prisma.budget.findMany({
      where,
      select: {
        numero_pedido: true,
        tipo_produto: true,
        data_entrega: true,
        titulo: true,
        tiragem: true,
        preco_unitario: true,
        preco_total: true,
        order: {
          select: {
            numero_pedido: true,
          },
        },
      },
      orderBy: {
        data_entrega: 'desc',
      },
    });

    const orders = budgets.map((budget) => ({
      numero_pedido:
        budget.order?.numero_pedido ??
        budget.numero_pedido ??
        '',
      tipo_produto: budget.tipo_produto ?? '',
      data_entrega: budget.data_entrega?.toISOString() ?? null,
      titulo: budget.titulo,
      tiragem: budget.tiragem,
      valorUnitario: budget.preco_unitario,
      valorTotal: budget.preco_total,
    }));

    const totalValorTotal = orders.reduce(
      (acc, order) => acc + order.valorTotal,
      0
    );

    return NextResponse.json({
      data: {
        orders,
        totalValorTotal,
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
