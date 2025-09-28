import { NextRequest } from 'next/server';
import prisma from "@/lib/prisma";
import { ok, serverError, conflict } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cnpjCpf = searchParams.get("value");

    if (!cnpjCpf) {
      return ok({ exists: false });
    }

    // Normalize to digits-only for a best-effort comparison
    const digits = cnpjCpf.replace(/\D+/g, "");

    // Try exact matches for both the raw and digits-only forms
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { cnpjCpf },
          { cnpjCpf: digits },
        ],
      },
    });

    if (existingClient) {
      return conflict("Cliente com este CNPJ/CPF já existe.", { exists: true });
    }

    return ok({ exists: false });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

