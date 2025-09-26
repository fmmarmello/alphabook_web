import prisma from "@/lib/prisma";
import { badRequest, conflict, notFound, ok, serverError } from "@/lib/api-response";
import { ClientSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return notFound("Cliente não encontrado");
    return ok(client);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const json = await req.json();
    const parsed = ClientSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) return notFound("Cliente não encontrado");
    const updated = await prisma.client.update({ where: { id }, data: parsed.data });
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
    const parsed = ClientSchema.partial().safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) return notFound("Cliente não encontrado");
    const updated = await prisma.client.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) return notFound("Cliente não encontrado");
    const inUse = await prisma.order.count({ where: { clientId: id } });
    if (inUse > 0) return conflict("Cliente possui ordens vinculadas e não pode ser removido", { orders: inUse });
    const deleted = await prisma.client.delete({ where: { id } });
    return ok(deleted);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

