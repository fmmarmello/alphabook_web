import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import prisma from "@/lib/prisma";
import { OrderSchema, OrderCreationSchema, parseSort, parseNumber } from "@/lib/validation";
import { generateNumeroPedido } from "@/lib/order-number";
import type { Prisma } from "@/generated/prisma";
import { OrderType, OrderStatus, BudgetStatus } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(request);
    
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
    const user = await requireApiAuth(request);
    
    const json = await request.json();
    const parsed = OrderCreationSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json({
        error: { 
          message: "Dados inválidos", 
          details: parsed.error.flatten() 
        }
      }, { status: 400 });
    }

    const data = parsed.data;

    // Handle budget-derived order creation
    if (data.budgetId) {
      const budget = await prisma.budget.findUnique({
        where: { id: data.budgetId },
        include: { client: true, center: true, order: true }
      });

      if (!budget) {
        return NextResponse.json({
          error: { 
            message: "Orçamento não encontrado", 
            details: { budgetId: data.budgetId } 
          }
        }, { status: 400 });
      }

      // Validate budget is approved
      if (budget.status !== BudgetStatus.APPROVED) {
        return NextResponse.json({
          error: { 
            message: "Orçamento deve estar aprovado para conversão em pedido", 
            details: { 
              budgetId: data.budgetId,
              currentStatus: budget.status 
            } 
          }
        }, { status: 400 });
      }

      // Validate budget hasn't already been converted
      if (budget.order) {
        return NextResponse.json({
          error: { 
            message: "Orçamento já foi convertido em pedido", 
            details: { 
              budgetId: data.budgetId,
              existingOrderId: budget.order.id 
            } 
          }
        }, { status: 400 });
      }

      // Validate budget has required relationships
      if (!budget.client || !budget.center) {
        return NextResponse.json({
          error: { 
            message: "Orçamento deve ter cliente e centro de produção definidos", 
            details: { budgetId: data.budgetId } 
          }
        }, { status: 400 });
      }

      // Create order from budget data
      const order = await prisma.$transaction(async (tx) => {
        // Generate order number automatically if not provided
        const numeroPedido = data.numero_pedido || await generateNumeroPedido();

        // Create the order with budget data
        const newOrder = await tx.order.create({
          data: {
            clientId: budget.clientId!,
            centerId: budget.centerId!,
            budgetId: data.budgetId,
            orderType: OrderType.BUDGET_DERIVED,
            status: OrderStatus.PENDING,
            title: data.title,
            tiragem: data.tiragem,
            formato: data.formato,
            numPaginasTotal: data.numPaginasTotal,
            numPaginasColoridas: data.numPaginasColoridas,
            valorUnitario: data.valorUnitario,
            valorTotal: data.valorTotal,
            prazoEntrega: data.prazoEntrega,
            obs: data.obs || "",
            numero_pedido: numeroPedido,
            data_pedido: data.data_pedido ? new Date(data.data_pedido) : null,
            data_entrega: data.data_entrega ? new Date(data.data_entrega) : null,
            solicitante: data.solicitante,
            documento: data.documento,
            editorial: data.editorial,
            tipo_produto: data.tipo_produto,
            cor_miolo: data.cor_miolo,
            papel_miolo: data.papel_miolo,
            papel_capa: data.papel_capa,
            cor_capa: data.cor_capa,
            laminacao: data.laminacao,
            acabamento: data.acabamento,
            shrink: data.shrink,
            pagamento: data.pagamento,
            frete: data.frete,
          }
        });

        // Update budget status to CONVERTED
        await tx.budget.update({
          where: { id: data.budgetId },
          data: {
            status: BudgetStatus.CONVERTED,
            convertedAt: new Date()
          }
        });

        return newOrder;
      });

      return NextResponse.json({
        data: { 
          ...order, 
          orderType: 'BUDGET_DERIVED',
          message: 'Pedido criado com sucesso a partir do orçamento' 
        },
        error: null
      }, { status: 201 });
    }

    // Handle direct order creation (no budget)
    // ✅ SECURITY: Direct orders require MODERATOR+ permissions
    if (user.role === Role.USER) {
      return NextResponse.json({
        error: { 
          message: "Apenas moderadores e administradores podem criar pedidos diretos", 
          details: { requiredRole: "MODERATOR ou ADMIN" } 
        }
      }, { status: 403 });
    }

    // For direct orders, clientId and centerId are required
    if (!data.clientId || !data.centerId) {
      return NextResponse.json({
        error: { 
          message: "Cliente e Centro de produção são obrigatórios para pedidos diretos", 
          details: { clientId: data.clientId, centerId: data.centerId } 
        }
      }, { status: 400 });
    }

    // Validate client and center exist and are active
    const [client, center] = await Promise.all([
      prisma.client.findUnique({ where: { id: data.clientId } }),
      prisma.center.findUnique({ where: { id: data.centerId } }),
    ]);
    
    if (!client) {
      return NextResponse.json({
        error: { 
          message: "Cliente não encontrado", 
          details: { clientId: data.clientId } 
        }
      }, { status: 400 });
    }

    if (!client.active) {
      return NextResponse.json({
        error: { 
          message: "Cliente não está ativo", 
          details: { clientId: data.clientId } 
        }
      }, { status: 400 });
    }
    
    if (!center) {
      return NextResponse.json({
        error: { 
          message: "Centro de produção não encontrado", 
          details: { centerId: data.centerId } 
        }
      }, { status: 400 });
    }

    if (!center.active) {
      return NextResponse.json({
        error: { 
          message: "Centro de produção não está ativo", 
          details: { centerId: data.centerId } 
        }
      }, { status: 400 });
    }

    // Generate order number automatically if not provided
    const numeroPedido = data.numero_pedido || await generateNumeroPedido();

    // Create direct order
    const order = await prisma.order.create({
      data: {
        clientId: data.clientId,
        centerId: data.centerId,
        orderType: OrderType.DIRECT_ORDER,
        status: OrderStatus.PENDING,
        title: data.title,
        tiragem: data.tiragem,
        formato: data.formato,
        numPaginasTotal: data.numPaginasTotal,
        numPaginasColoridas: data.numPaginasColoridas,
        valorUnitario: data.valorUnitario,
        valorTotal: data.valorTotal,
        prazoEntrega: data.prazoEntrega,
        obs: data.obs || "",
        numero_pedido: numeroPedido,
        data_pedido: data.data_pedido ? new Date(data.data_pedido) : null,
        data_entrega: data.data_entrega ? new Date(data.data_entrega) : null,
        solicitante: data.solicitante,
        documento: data.documento,
        editorial: data.editorial,
        tipo_produto: data.tipo_produto,
        cor_miolo: data.cor_miolo,
        papel_miolo: data.papel_miolo,
        papel_capa: data.papel_capa,
        cor_capa: data.cor_capa,
        laminacao: data.laminacao,
        acabamento: data.acabamento,
        shrink: data.shrink,
        pagamento: data.pagamento,
        frete: data.frete,
      }
    });
    
    return NextResponse.json({
      data: { 
        ...order, 
        orderType: 'DIRECT_ORDER',
        message: 'Pedido direto criado com sucesso' 
      },
      error: null
    }, { status: 201 });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
