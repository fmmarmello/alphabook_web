// src/app/api/orders/[id]/route.ts - CREATE NEW FILE

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { z } from 'zod';

const UpdateOrderSchema = z.object({
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'COMPLETED', 'DELIVERED', 'CANCELLED', 'ON_HOLD']).optional(),
  data_entrega_real: z.string().datetime().optional().nullable(),
  data_inicio_producao: z.string().datetime().optional().nullable(),
  data_fim_producao: z.string().datetime().optional().nullable(),
  obs_producao: z.string().optional().nullable(),
  frete_real: z.number().optional().nullable(),
  custo_adicional: z.number().optional().nullable(),
  responsavel_producao: z.string().optional().nullable()
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireApiAuth(req);
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        budget: {
          include: {
            client: true,
            center: true,
            approvedBy: true
          }
        }
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
  { params }: { params: { id: string } }
) {
  try {
    await requireApiAuth(req);
    const body = await req.json();
    const updateData = UpdateOrderSchema.parse(body);

    // Convert date strings to Date objects
    const processedData: any = { ...updateData };
    if (processedData.data_entrega_real) {
      processedData.data_entrega_real = new Date(processedData.data_entrega_real);
    }
    if (processedData.data_inicio_producao) {
      processedData.data_inicio_producao = new Date(processedData.data_inicio_producao);
    }
    if (processedData.data_fim_producao) {
      processedData.data_fim_producao = new Date(processedData.data_fim_producao);
    }

    const order = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: processedData,
      include: {
        budget: {
          include: {
            client: true,
            center: true
          }
        }
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
  { params }: { params: { id: string } }
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

    await prisma.order.delete({
      where: { id: parseInt(params.id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
