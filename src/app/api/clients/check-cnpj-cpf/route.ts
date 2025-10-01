import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, handleApiError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    getAuthenticatedUser(req);
    
    // ✅ SECURITY: All authenticated users can check CNPJ/CPF duplicates

    const { searchParams } = new URL(req.url);
    const cnpjCpf = searchParams.get("value");

    if (!cnpjCpf) {
      return NextResponse.json({
        data: { exists: false },
        error: null
      });
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
      return NextResponse.json({
        error: {
          message: "Cliente com este CNPJ/CPF já existe.",
          details: { exists: true }
        }
      }, { status: 409 });
    }

    return NextResponse.json({
      data: { exists: false },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
