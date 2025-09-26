import prisma from "@/lib/prisma";
import { badRequest, ok, serverError } from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const where: any = {};
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

    return ok(data, { dateFrom, dateTo });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

