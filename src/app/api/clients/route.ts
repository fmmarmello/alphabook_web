// Use Request for broad compatibility with Next route handlers
import prisma from "@/lib/prisma";
import { ok, created, badRequest, serverError, conflict } from "@/lib/api-response";
import { ClientSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const url = req?.url ? new URL(req.url) : new URL("http://localhost");
    const { searchParams } = url;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const q = searchParams.get("q");
    const sortBy = searchParams.get("sortBy") ?? "id";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    const allowedSort = new Set(["id", "name", "email", "cnpjCpf"]);
    const orderBy = allowedSort.has(sortBy) ? { [sortBy]: sortOrder } : { id: "desc" as const };

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { cnpjCpf: { contains: q } },
          ],
        }
      : {};

    const total = await prisma.client.count({ where });
    const data = await prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return ok(data, {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
      sortBy: Object.keys(orderBy)[0],
      sortOrder: sortOrder,
      q,
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ClientSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Dados inválidos", parsed.error.flatten());
    }

    const { cnpjCpf, force, ...clientData } = parsed.data;

    if (!force) {
      const existingClient = await prisma.client.findFirst({
        where: { cnpjCpf },
      });

      if (existingClient) {
        return conflict("Cliente com este CNPJ/CPF já existe.");
      }
    }

    const client = await prisma.client.create({ data: { ...clientData, cnpjCpf } });
    return created(client);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

