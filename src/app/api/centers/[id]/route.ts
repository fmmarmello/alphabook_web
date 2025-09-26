import prisma from "@/lib/prisma";
import { badRequest, conflict, notFound, ok, serverError } from "@/lib/api-response";
import { CenterSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const center = await prisma.center.findUnique({ where: { id } });
    if (!center) return notFound("Centro não encontrado");
    return ok(center);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const json = await req.json();
    const parsed = CenterSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const exists = await prisma.center.findUnique({ where: { id } });
    if (!exists) return notFound("Centro não encontrado");
    const updated = await prisma.center.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const json = await req.json();
    const parsed = CenterSchema.partial().safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const exists = await prisma.center.findUnique({ where: { id } });
    if (!exists) return notFound("Centro não encontrado");
    const updated = await prisma.center.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const exists = await prisma.center.findUnique({ where: { id } });
    if (!exists) return notFound("Centro não encontrado");
    const inUse = await prisma.order.count({ where: { centerId: id } });
    if (inUse > 0) return conflict("Centro possui ordens vinculadas e não pode ser removido", { orders: inUse });
    const deleted = await prisma.center.delete({ where: { id } });
    return ok(deleted);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

