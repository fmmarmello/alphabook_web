// Use Request for broad compatibility with Next route handlers
import prisma from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api-response";
import { OrderSchema, parseSort, parseNumber } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const url = req?.url ? new URL(req.url) : new URL("http://localhost");
    const { searchParams } = url;
    const page = parseNumber(searchParams.get("page"), 1);
    const pageSize = parseNumber(searchParams.get("pageSize"), 20);
    const q = searchParams.get("q");
    const clientId = searchParams.get("clientId");
    const centerId = searchParams.get("centerId");
    const sortBy = searchParams.get("sortBy") ?? "id";
    const sortOrder = parseSort(searchParams.get("sortOrder"));
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const allowedSort = new Set([
      "id",
      "title",
      "tiragem",
      "valorTotal",
      "valorUnitario",
      "numPaginasTotal",
      "numPaginasColoridas",
      "prazoEntrega",
      "date",
      "numero_pedido",
      "data_pedido",
      "data_entrega",
      "solicitante",
      "documento",
      "editorial",
      "tipo_produto",
    ]);
    const orderBy = allowedSort.has(sortBy) ? { [sortBy]: sortOrder } : { id: "desc" as const };

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { obs: { contains: q } },
        { formato: { contains: q } },
        { numero_pedido: { contains: q } },
        { solicitante: { contains: q } },
        { documento: { contains: q } },
        { editorial: { contains: q } },
        { tipo_produto: { contains: q } },
      ];
    }
    if (clientId) where.clientId = Number(clientId);
    if (centerId) where.centerId = Number(centerId);
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const total = await prisma.order.count({ where });
    const data = await prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { client: true, center: true },
    });
    return ok(data, {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
      sortBy: Object.keys(orderBy)[0],
      sortOrder,
      q,
      clientId: clientId ? Number(clientId) : null,
      centerId: centerId ? Number(centerId) : null,
      dateFrom,
      dateTo,
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    // coerce numbers if needed (client sends numbers already)
    const parsed = OrderSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const [client, center] = await Promise.all([
      prisma.client.findUnique({ where: { id: parsed.data.clientId } }),
      prisma.center.findUnique({ where: { id: parsed.data.centerId } }),
    ]);
    if (!client) return badRequest("Cliente não encontrado", { clientId: parsed.data.clientId });
    if (!center) return badRequest("Centro de produção não encontrado", { centerId: parsed.data.centerId });

    const order = await prisma.order.create({ data: parsed.data });
    return created(order);
  } catch (error) {
    return serverError((error as Error).message);
  }
}
