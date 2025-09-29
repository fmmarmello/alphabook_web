import prisma from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: Request) {
  try {
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

    const data = recentOrders.map((order) => ({
      id: order.id,
      title: order.title,
      valorTotal: order.valorTotal,
      status: order.status,
      date: order.date,
      numero_pedido: order.numero_pedido,
      client: order.client,
      center: order.center,
    }));

    return ok(data);
  } catch (error) {
    return serverError((error as Error).message);
  }
}