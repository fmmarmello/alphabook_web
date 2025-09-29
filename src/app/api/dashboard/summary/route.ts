import prisma from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const [clientsCount, ordersCount, totalRevenue, pendingOrdersCount] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Total orders
      prisma.order.count(),

      // Total revenue (sum of valorTotal)
      prisma.order.aggregate({
        _sum: {
          valorTotal: true,
        },
      }),

      // Pending orders (status = "Pendente")
      prisma.order.count({
        where: {
          status: "Pendente",
        },
      }),
    ]);

    const data = {
      totalClients: clientsCount,
      totalOrders: ordersCount,
      totalRevenue: totalRevenue._sum.valorTotal ?? 0,
      pendingOrders: pendingOrdersCount,
    };

    return ok(data);
  } catch (error) {
    return serverError((error as Error).message);
  }
}