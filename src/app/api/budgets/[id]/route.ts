// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\api\\budgets\[id]\\route.ts
import prisma from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";
import { BudgetSchema } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) return badRequest("ID inválido");

    const budget = await prisma.budget.findUnique({
      where: { id },
    });
    if (!budget) return notFound("Orçamento não encontrado");

    return ok(budget);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) return badRequest("ID inválido");

    const json = await req.json();
    const parsed = BudgetSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const existingBudget = await prisma.budget.findUnique({ where: { id } });
    if (!existingBudget) return notFound("Orçamento não encontrado");

    const budget = await prisma.budget.update({
      where: { id },
      data: parsed.data,
    });
    return ok(budget);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) return badRequest("ID inválido");

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) return notFound("Orçamento não encontrado");

    await prisma.budget.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
