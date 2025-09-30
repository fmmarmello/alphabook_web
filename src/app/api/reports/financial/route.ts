
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

const FilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  editorial: z.string().optional(),
  centerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
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

    const where: any = {};
    if (dateFrom) {
      where.date = { ...where.date, gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.date = { ...where.date, lte: new Date(dateTo) };
    }
    if (editorial && editorial !== 'all') {
      where.editorial = { contains: editorial, mode: 'insensitive' };
    }
    if (centerId && centerId !== 'all') {
      where.centerId = parseInt(centerId, 10);
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        numero_pedido: true,
        tipo_produto: true,
        data_entrega: true,
        title: true,
        tiragem: true,
        valorUnitario: true,
        valorTotal: true,
      },
      orderBy: {
        data_entrega: 'desc',
      },
    });

    const totalValorTotal = orders.reduce((acc, order) => acc + order.valorTotal, 0);

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
