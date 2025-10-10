// src/app/api/orders/[id]/route.ts - CREATE NEW FILE

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { z } from 'zod';

const dateField = z.coerce.date().optional().nullable();

const UpdateOrderSchema = z.object({
  status: z
    .enum([
      'PENDING',
      'IN_PRODUCTION',
      'COMPLETED',
      'DELIVERED',
      'CANCELLED',
      'ON_HOLD',
    ])
    .optional(),
  data_entrega_real: dateField,
  data_inicio_producao: dateField,
  data_fim_producao: dateField,
  obs_producao: z.string().optional().nullable(),
  frete_real: z.number().optional().nullable(),
  custo_adicional: z.number().optional().nullable(),
  responsavel_producao: z.string().optional().nullable(),
});

async function getOrderId(
  context: { params: Promise<{ id: string }> }
): Promise<number | null> {
  const { id } = await context.params;
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth(req);
    const orderId = await getOrderId(context);
    if (!orderId) {
      return NextResponse.json(
        { error: { message: 'Identificador de ordem inválido' } },
        { status: 400 }
      );
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        budget: {
          include: {
            client: true,
            center: true,
            approvedBy: true,
            rejectedBy: true,
          },
        },
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Ordem não encontrada' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth(req);
    const body = await req.json();
    const updateData = UpdateOrderSchema.parse(body);
    const orderId = await getOrderId(context);
    if (!orderId) {
      return NextResponse.json(
        { error: { message: 'Identificador de ordem inválido' } },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        budget: {
          include: {
            client: true,
            center: true,
            approvedBy: true,
            rejectedBy: true,
          },
        },
      }
    });

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth(req);
    
    // Only admins can delete orders
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { message: 'Acesso negado. Apenas administradores podem excluir ordens.' } },
        { status: 403 }
      );
    }

    const orderId = await getOrderId(context);
    if (!orderId) {
      return NextResponse.json(
        { error: { message: 'Identificador de ordem inválido' } },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
