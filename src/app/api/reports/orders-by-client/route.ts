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
    
    // ✅ SECURITY: Orders by client with financial data - ADMIN/MODERATOR only
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to access client financial reports', 403);
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.OrderWhereInput = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const grouped = await prisma.order.groupBy({
      by: ["clientId"],
      where,
      _sum: { valorTotal: true },
      _count: { id: true },
    });

    const clientIds = grouped.map((g) => g.clientId);
    const clients = await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } });
    const nameMap = new Map(clients.map((c) => [c.id, c.name] as const));

    const data = grouped.map((g) => ({
      clientId: g.clientId,
      clientName: nameMap.get(g.clientId) ?? "-",
      orders: g._count.id,
      total: g._sum.valorTotal ?? 0,
    }));

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
