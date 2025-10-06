import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
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
    await requireApiAuth(req);
    
    // ✅ SECURITY: Production reports require authentication (all roles can access production data)
    // Users can see production info but not financial data

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = FilterSchema.safeParse(query);
    if (!validation.success) {
      return NextResponse.json({
        error: { message: 'Invalid query parameters', details: validation.error.flatten() }
      }, { status: 400 });
    }

    const { dateFrom, dateTo, editorial, centerId } = validation.data;

    const where: Prisma.OrderWhereInput = {};
    const dateFilter: Prisma.DateTimeFilter<"Order"> = {} as Prisma.DateTimeFilter<"Order">;
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }
    if (Object.keys(dateFilter).length) {
      where.date = dateFilter;
    }
    if (editorial && editorial !== 'all') {
      where.editorial = { contains: editorial };
    }
    if (centerId && centerId !== 'all') {
      where.centerId = parseInt(centerId, 10);
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        numero_pedido: true,
        data_entrega: true,
        title: true,
        tiragem: true,
      },
      orderBy: {
        data_entrega: 'desc',
      },
    });

    const totalTiragem = orders.reduce((acc, order) => acc + order.tiragem, 0);

    return NextResponse.json({
      data: {
        orders,
        totalTiragem,
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
