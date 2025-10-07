// src/app/api/budgets/[id]/convert-to-order/route.ts - CREATE NEW FILE

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { generateNumeroPedido } from '@/lib/order-number';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiAuth(req);
    const budgetId = parseInt(params.id);
    const { obs_producao, responsavel_producao } = await req.json();

    // Check if user can convert to order (MODERATOR or ADMIN)
    if (user.role === 'USER') {
      return NextResponse.json(
        { error: { message: 'Acesso negado. Apenas moderadores e administradores podem converter orçamentos.' } },
        { status: 403 }
      );
    }

    // Validate budget
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { order: true }
    });

    if (!budget) {
      return NextResponse.json(
        { error: { message: 'Orçamento não encontrado' } },
        { status: 404 }
      );
    }

    if (budget.status !== 'APPROVED') {
      return NextResponse.json(
        { error: { message: 'Apenas orçamentos aprovados podem ser convertidos em ordens' } },
        { status: 400 }
      );
    }

    if (budget.order) {
      return NextResponse.json(
        { error: { message: 'Este orçamento já possui uma ordem associada' } },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        budgetId,
        numero_pedido: await generateNumeroPedido('ORDER'),
        orderType: 'BUDGET_DERIVED',
        obs_producao,
        responsavel_producao,
        status: 'PENDING'
      },
      include: {
        budget: {
          include: {
            client: true,
            center: true
          }
        }
      }
    });

    // Mark budget as converted
    await prisma.budget.update({
      where: { id: budgetId },
      data: { 
        status: 'CONVERTED',
        convertedAt: new Date()
      }
    });

    return NextResponse.json({ 
      data: order,
      message: 'Orçamento convertido em ordem com sucesso!'
    });
  } catch (error) {
    console.error('Error converting budget to order:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
