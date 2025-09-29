
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, badRequest, serverError } from '@/lib/api-response';

const FilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  editorial: z.string().optional(),
  centerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = FilterSchema.safeParse(query);
    if (!validation.success) {
      return badRequest('Invalid query parameters');
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
        titulo: true,
        tiragem: true,
        valorUnitario: true,
        valorTotal: true,
      },
      orderBy: {
        data_entrega: 'desc',
      },
    });

    const totalValorTotal = orders.reduce((acc, order) => acc + order.valorTotal, 0);

    return ok({
      orders,
      totalValorTotal,
    });
  } catch {
    return serverError('An error occurred while fetching the financial report.');
  }
}
