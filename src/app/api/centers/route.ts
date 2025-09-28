// Use Request for broad compatibility with Next route handlers
import prisma from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api-response";
import { CenterSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const url = req?.url ? new URL(req.url) : new URL("http://localhost");
    const { searchParams } = url;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const q = searchParams.get("q");
    const type = searchParams.get("type");
    const sortBy = searchParams.get("sortBy") ?? "id";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    const allowedSort = new Set(["id", "name", "type"]);
    const orderBy = allowedSort.has(sortBy) ? { [sortBy]: sortOrder } : { id: "desc" as const };

    const where: any = {};
    if (q) where.OR = [{ name: { contains: q } }, { obs: { contains: q } }];
    if (type) where.type = type;

    const total = await prisma.center.count({ where });
    const data = await prisma.center.findMany({
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
      sortOrder,
      q,
      type,
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = CenterSchema.safeParse(json);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());
    const center = await prisma.center.create({ data: parsed.data });
    return created(center);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

