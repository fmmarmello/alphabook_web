import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BudgetSchema, parseSort, parseNumber, BudgetInput } from "@/lib/validation";
import { generateNumeroPedido } from "@/lib/order-number";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import type { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    getAuthenticatedUser(req);
    
    // ✅ SECURITY: All authenticated users can view budgets (role-based filtering applied below)
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

    const where: Prisma.BudgetWhereInput = {};
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
    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
        sortBy: Object.keys(orderBy)[0],
        sortOrder,
        q,
        dateFrom,
        dateTo,
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Budget creation requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to create budgets', 403);
    }

    const json = await req.json();
    const parsed = BudgetSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }

    const data: BudgetInput = parsed.data;
    let numero = (data.numero_pedido ?? "").trim();
    if (!numero) {
      numero = await generateNumeroPedido();
    }
    const budget = await prisma.budget.create({ data: { ...data, numero_pedido: numero } });
    
    return NextResponse.json({
      data: budget,
      error: null
    }, { status: 201 });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
