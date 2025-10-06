import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "5");

    const recentOrders = await prisma.order.findMany({
      take: limit,
      orderBy: {
        date: "desc",
      },
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
          },
        },
      },
    });

    // ✅ SECURITY: Role-based data filtering for recent orders
    const data = recentOrders.map((order) => {
      const baseData = {
        id: order.id,
        title: order.title,
        status: order.status,
        date: order.date,
        numero_pedido: order.numero_pedido,
        client: order.client,
        center: order.center,
      };

      // Financial data only for ADMIN and MODERATOR
      if (user.role === Role.ADMIN || user.role === Role.MODERATOR) {
        return {
          ...baseData,
          valorTotal: order.valorTotal,
        };
      }

      // Users don't see financial data
      return baseData;
    });

    return NextResponse.json({
      data,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
