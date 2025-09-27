
import { NextRequest } from 'next/server';
import prisma from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cnpjCpf = searchParams.get("value");

    if (!cnpjCpf) {
      return ok({ exists: false });
    }

    const existingClient = await prisma.client.findFirst({
      where: { cnpjCpf },
    });

    if (existingClient) {
      return new Response(JSON.stringify({ exists: true, message: "Cliente com este CNPJ/CPF já existe." }), { status: 409 });
    }

    return ok({ exists: false });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
