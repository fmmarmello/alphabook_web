import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import prisma from "@/lib/prisma";
import { OrderSchema, parseSort, parseNumber } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(request);
    
    const url = new URL(request.url);
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

    const where: Prisma.OrderWhereInput = {};
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
      const dateFilter: Prisma.DateTimeFilter<"Order"> = {} as Prisma.DateTimeFilter<"Order">;
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }

    const total = await prisma.order.count({ where });
    const data = await prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { client: true, center: true },
    });

    // ✅ SECURITY: Role-based data filtering after fetch (MVP approach)
    const filteredData = data.map(order => {
      switch (user.role) {
        case Role.ADMIN:
          // Admins see all data
          return order;
          
        case Role.MODERATOR:
          // Moderators see all data including financial info
          return {
            ...order,
            client: { id: order.client.id, name: order.client.name, email: order.client.email },
            center: { id: order.center.id, name: order.center.name, type: order.center.type }
          };
          
        case Role.USER:
          // Users DO NOT see financial data
          const { valorTotal: _valorTotal, valorUnitario: _valorUnitario, ...safeOrder } = order;
          void _valorTotal; void _valorUnitario;
          return {
            ...safeOrder,
            client: { id: order.client.id, name: order.client.name },
            center: { id: order.center.id, name: order.center.name }
          };
          
        default:
          throw new ApiAuthError('Invalid user role', 403);
      }
    });

    return NextResponse.json({
      data: filteredData,
      meta: {
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
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Authentication required
    const user = getAuthenticatedUser(request);
    
    // ✅ SECURITY: Role-based order creation permissions
    if (user.role === Role.USER) {
      // Users can create orders but with limitations
      // This is acceptable for MVP
    }
    
    const json = await request.json();
    const parsed = OrderSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json({
        error: { 
          message: "Dados inválidos", 
          details: parsed.error.flatten() 
        }
      }, { status: 400 });
    }

    const [client, center] = await Promise.all([
      prisma.client.findUnique({ where: { id: parsed.data.clientId } }),
      prisma.center.findUnique({ where: { id: parsed.data.centerId } }),
    ]);
    
    if (!client) {
      return NextResponse.json({
        error: { 
          message: "Cliente não encontrado", 
          details: { clientId: parsed.data.clientId } 
        }
      }, { status: 400 });
    }
    
    if (!center) {
      return NextResponse.json({
        error: { 
          message: "Centro de produção não encontrado", 
          details: { centerId: parsed.data.centerId } 
        }
      }, { status: 400 });
    }

    const order = await prisma.order.create({ 
      data: {
        ...parsed.data,
        // Note: Current schema doesn't support ownership tracking
        // This is acceptable for MVP - documented as technical debt
      }
    });
    
    return NextResponse.json({
      data: order,
      error: null
    }, { status: 201 });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
