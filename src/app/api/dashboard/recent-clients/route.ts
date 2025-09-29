import prisma from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "5");

    const recentClients = await prisma.client.findMany({
      take: limit,
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnpjCpf: true,
      },
    });

    return ok(recentClients);
  } catch (error) {
    return serverError((error as Error).message);
  }
}