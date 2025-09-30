import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Orders summary with financial data - ADMIN/MODERATOR only
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to access financial summary reports', 403);
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const where: any = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [agg, byCenter] = await Promise.all([
      prisma.order.aggregate({ where, _count: { id: true }, _sum: { valorTotal: true } }),
      prisma.order.groupBy({ by: ["centerId"], where, _count: { id: true }, _sum: { valorTotal: true } }),
    ]);

    const centerIds = byCenter.map((g) => g.centerId);
    const centers = await prisma.center.findMany({ where: { id: { in: centerIds } }, select: { id: true, name: true } });
    const centerMap = new Map(centers.map((c) => [c.id, c.name] as const));

    const data = {
      totalOrders: agg._count.id ?? 0,
      totalAmount: agg._sum.valorTotal ?? 0,
      byCenter: byCenter.map((g) => ({
        centerId: g.centerId,
        centerName: centerMap.get(g.centerId) ?? "-",
        orders: g._count.id,
        total: g._sum.valorTotal ?? 0,
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

