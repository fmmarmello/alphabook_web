import prisma from "@/lib/prisma";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { OrderSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const order = await prisma.order.findUnique({ where: { id }, include: { client: true, center: true } });
    if (!order) return notFound("Ordem não encontrada");
    return ok(order);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const json = await req.json();
    const parsed = OrderSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) return notFound("Ordem não encontrada");
    const [client, center] = await Promise.all([
      prisma.client.findUnique({ where: { id: parsed.data.clientId } }),
      prisma.center.findUnique({ where: { id: parsed.data.centerId } }),
    ]);
    if (!client) return badRequest("Cliente não encontrado", { clientId: parsed.data.clientId });
    if (!center) return badRequest("Centro de produção não encontrado", { centerId: parsed.data.centerId });
    const updated = await prisma.order.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const json = await req.json();
    const parsed = OrderSchema.partial().safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) return notFound("Ordem não encontrada");

    if (parsed.data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
      if (!client) return badRequest("Cliente não encontrado", { clientId: parsed.data.clientId });
    }
    if (parsed.data.centerId) {
      const center = await prisma.center.findUnique({ where: { id: parsed.data.centerId } });
      if (!center) return badRequest("Centro de produção não encontrado", { centerId: parsed.data.centerId });
    }

    const updated = await prisma.order.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("ID inválido");
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) return notFound("Ordem não encontrada");
    const deleted = await prisma.order.delete({ where: { id } });
    return ok(deleted);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

