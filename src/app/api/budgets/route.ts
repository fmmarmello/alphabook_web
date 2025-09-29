import prisma from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api-response";
import { BudgetSchema, parseSort, parseNumber } from "@/lib/validation";
import { generateNumeroPedido } from "@/lib/order-number";

export async function GET(req: Request) {
  try {
    const url = req?.url ? new URL(req.url) : new URL("http://localhost");
    const { searchParams } = url;
    const page = parseNumber(searchParams.get("page"), 1);
    const pageSize = parseNumber(searchParams.get("pageSize"), 20);
    const q = searchParams.get("q");
    const sortBy = searchParams.get("sortBy") ?? "id";
    const sortOrder = parseSort(searchParams.get("sortOrder"));
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const allowedSort = new Set([
      "id",
      "titulo",
      "tiragem",
      "preco_total",
      "preco_unitario",
      "total_pgs",
      "pgs_colors",
      "prazo_producao",
      "data_pedido",
      "numero_pedido",
      "solicitante",
      "documento",
      "editorial",
      "tipo_produto",
    ]);
    const orderBy = allowedSort.has(sortBy) ? { [sortBy]: sortOrder } : { id: "desc" as const };

    const where: any = {};
    if (q) {
      where.OR = [
        { titulo: { contains: q } },
        { observacoes: { contains: q } },
        { formato: { contains: q } },
        { numero_pedido: { contains: q } },
        { solicitante: { contains: q } },
        { documento: { contains: q } },
        { editorial: { contains: q } },
        { tipo_produto: { contains: q } },
      ];
    }
    if (dateFrom || dateTo) {
      where.data_pedido = {};
      if (dateFrom) where.data_pedido.gte = new Date(dateFrom);
      if (dateTo) where.data_pedido.lte = new Date(dateTo);
    }

    const total = await prisma.budget.count({ where });
    const data = await prisma.budget.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(data, {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
      sortBy: Object.keys(orderBy)[0],
      sortOrder,
      q,
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
    const parsed = BudgetSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const data: any = parsed.data;
    let numero = (data.numero_pedido ?? "").trim();
    if (!numero) {
      numero = await generateNumeroPedido();
    }
    const budget = await prisma.budget.create({ data: { ...data, numero_pedido: numero } });
    return created(budget);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

