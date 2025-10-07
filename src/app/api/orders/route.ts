// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { generateNumeroPedido } from '@/lib/order-number';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  budgetId: z.number(),
  obs_producao: z.string().optional(),
  responsavel_producao: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiAuth(req);
    const body = await req.json();
    const { budgetId, obs_producao, responsavel_producao } = CreateOrderSchema.parse(body);

    // Validate budget exists and is APPROVED
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { order: true, client: true, center: true }
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

    // Create order with minimal data
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

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth(req);
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    const where: any = {};
    
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { numero_pedido: { contains: search, mode: 'insensitive' } },
        { budget: { titulo: { contains: search, mode: 'insensitive' } } },
        { budget: { client: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        budget: {
          include: {
            client: true,
            center: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    const total = await prisma.order.count({ where });

    return NextResponse.json({
      data: orders,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
