import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { generateNumeroPedido } from "@/lib/order-number";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Budget conversion requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to convert budgets to orders', 403);
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

    const budget = await prisma.budget.findUnique({ 
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } },
        order: { select: { id: true } } // Check if already converted
      }
    });

    if (!budget) {
      return NextResponse.json({
        error: { message: "Orçamento não encontrado", details: null }
      }, { status: 404 });
    }

    // ✅ VALIDATION: Check if budget can be converted
    if (budget.status !== 'APPROVED') {
      return NextResponse.json({
        error: { message: "Apenas orçamentos aprovados podem ser convertidos em pedidos", details: null }
      }, { status: 400 });
    }

    // ✅ VALIDATION: Check if already converted
    if (budget.order) {
      return NextResponse.json({
        error: { message: "Este orçamento já foi convertido em pedido", details: null }
      }, { status: 400 });
    }

    // ✅ VALIDATION: Ensure budget has required client and center
    if (!budget.clientId || !budget.centerId) {
      return NextResponse.json({
        error: { message: "Orçamento deve ter cliente e centro de produção definidos", details: null }
      }, { status: 400 });
    }

    // ✅ VALIDATION: Verify client and center still exist and are active
    const [client, center] = await Promise.all([
      prisma.client.findFirst({ 
        where: { id: budget.clientId, active: true },
        select: { id: true, name: true }
      }),
      prisma.center.findFirst({ 
        where: { id: budget.centerId, active: true },
        select: { id: true, name: true }
      })
    ]);

    if (!client) {
      return NextResponse.json({
        error: { message: "Cliente associado ao orçamento não foi encontrado ou está inativo", details: null }
      }, { status: 400 });
    }

    if (!center) {
      return NextResponse.json({
        error: { message: "Centro de produção associado ao orçamento não foi encontrado ou está inativo", details: null }
      }, { status: 400 });
    }

    // Generate order number if budget doesn't have one
    let numeroOrder = budget.numero_pedido;
    if (!numeroOrder) {
      numeroOrder = await generateNumeroPedido();
    }

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the order from approved budget
      const order = await tx.order.create({
        data: {
          clientId: budget.clientId!, // Non-null assertion since we validated above
          centerId: budget.centerId!, // Non-null assertion since we validated above
          budgetId: budget.id,
          orderType: 'BUDGET_DERIVED',
          title: budget.titulo,
          tiragem: budget.tiragem,
          formato: budget.formato,
          numPaginasTotal: budget.total_pgs,
          numPaginasColoridas: budget.pgs_colors,
          valorUnitario: budget.preco_unitario,
          valorTotal: budget.preco_total,
          prazoEntrega: budget.prazo_producao || "",
          obs: budget.observacoes || "",
          numero_pedido: numeroOrder,
          data_pedido: budget.data_pedido,
          data_entrega: budget.data_entrega,
          solicitante: budget.solicitante || undefined,
          documento: budget.documento || undefined,
          editorial: budget.editorial || undefined,
          tipo_produto: budget.tipo_produto || undefined,
          cor_miolo: budget.cor_miolo || undefined,
          papel_miolo: budget.papel_miolo || undefined,
          papel_capa: budget.papel_capa || undefined,
          cor_capa: budget.cor_capa || undefined,
          laminacao: budget.laminacao || undefined,
          acabamento: budget.acabamento || undefined,
          shrink: budget.shrink || undefined,
          pagamento: budget.pagamento || undefined,
          frete: budget.frete || undefined,
          status: 'PENDING'
        },
        include: {
          client: { select: { id: true, name: true } },
          center: { select: { id: true, name: true } }
        }
      });

      // Update budget status to CONVERTED
      const updatedBudget = await tx.budget.update({
        where: { id },
        data: { 
          status: 'CONVERTED',
          convertedAt: new Date(),
          numero_pedido: numeroOrder // Update if it was generated
        },
        include: {
          client: { select: { id: true, name: true } },
          center: { select: { id: true, name: true } }
        }
      });

      return { order, budget: updatedBudget };
    });

    return NextResponse.json({
      data: result,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}