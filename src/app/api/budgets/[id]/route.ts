import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BudgetSchema } from '@/lib/validation';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

const BUDGET_RELATIONS = {
  client: {
    select: {
      id: true,
      name: true,
      cnpjCpf: true,
      email: true,
      phone: true,
    },
  },
  center: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  order: {
    select: {
      id: true,
      numero_pedido: true,
      status: true,
    },
  },
} as const;

function parseId(raw: string) {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireApiAuth(req);

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID invalido', details: null } },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: BUDGET_RELATIONS,
    });

    if (!budget) {
      return NextResponse.json(
        { error: { message: 'Orcamento nao encontrado', details: null } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: budget,
      error: null,
    });
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiAuth(req);

    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to update budgets', 403);
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID invalido', details: null } },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const parsed = BudgetSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Dados invalidos',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existingBudget = await prisma.budget.findUnique({ where: { id } });
    if (!existingBudget) {
      return NextResponse.json(
        { error: { message: 'Orcamento nao encontrado', details: null } },
        { status: 404 }
      );
    }

    const updateData = {
      ...parsed.data,
      data_pedido: parsed.data.data_pedido
        ? new Date(parsed.data.data_pedido)
        : undefined,
      data_entrega: parsed.data.data_entrega
        ? new Date(parsed.data.data_entrega)
        : undefined,
    };

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: BUDGET_RELATIONS,
    });

    return NextResponse.json({
      data: budget,
      error: null,
    });
  } catch (error) {
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

    if (user.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete budgets', 403);
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID invalido', details: null } },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) {
      return NextResponse.json(
        { error: { message: 'Orcamento nao encontrado', details: null } },
        { status: 404 }
      );
    }

    await prisma.budget.delete({ where: { id } });

    return NextResponse.json({
      data: { deleted: true },
      error: null,
    });
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
