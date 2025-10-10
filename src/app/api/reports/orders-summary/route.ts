import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import type { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Orders summary with financial data - ADMIN/MODERATOR only
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to access financial summary reports', 403);
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.BudgetWhereInput = {
      order: {
        isNot: null,
      },
    };
    const dateFilter: Prisma.DateTimeNullableFilter = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }
    if (Object.keys(dateFilter).length) {
      where.data_entrega = dateFilter;
    }

    const [agg, byCenter] = await Promise.all([
      prisma.budget.aggregate({
        where,
        _count: { id: true },
        _sum: { preco_total: true },
      }),
      prisma.budget.groupBy({
        by: ["centerId"],
        where,
        _count: { id: true },
        _sum: { preco_total: true },
      }),
    ]);

    const centerIds = byCenter.map((g) => g.centerId);
    const centers = await prisma.center.findMany({ where: { id: { in: centerIds } }, select: { id: true, name: true } });
    const centerMap = new Map(centers.map((c) => [c.id, c.name] as const));

    const data = {
      totalOrders: agg._count.id ?? 0,
      totalAmount: agg._sum.preco_total ?? 0,
      byCenter: byCenter.map((g) => ({
        centerId: g.centerId,
        centerName: centerMap.get(g.centerId) ?? "-",
        orders: g._count.id,
        total: g._sum.preco_total ?? 0,
      })),
    };

    return NextResponse.json({
      data,
      meta: { dateFrom, dateTo },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
