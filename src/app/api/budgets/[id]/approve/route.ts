import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { generateNumeroPedido } from "@/lib/order-number";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Budget approval requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to approve budgets', 403);
    }

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({
        error: { message: "ID inválido", details: null }
      }, { status: 400 });
    }

    let budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) {
      return NextResponse.json({
        error: { message: "Orçamento não encontrado", details: null }
      }, { status: 404 });
    }

    if (!budget.numero_pedido) {
      const numero = await generateNumeroPedido();
      budget = await prisma.budget.update({ where: { id }, data: { numero_pedido: numero } });
    }

    const order = await prisma.order.create({
      data: {
        title: budget.titulo,
        tiragem: budget.tiragem,
        formato: budget.formato,
        numPaginasTotal: budget.total_pgs,
        numPaginasColoridas: budget.pgs_colors,
        valorUnitario: budget.preco_unitario,
        valorTotal: budget.preco_total,
        prazoEntrega: budget.prazo_producao || "",
        obs: budget.observacoes || "",
        numero_pedido: budget.numero_pedido,
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
        clientId: 1,
        centerId: 1,
      },
    });

    await prisma.budget.update({
      where: { id },
      data: { approved: true, orderId: order.id },
    });

    return NextResponse.json({
      data: order,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

