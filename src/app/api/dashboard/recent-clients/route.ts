import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = await requireApiAuth(req);
    
    // ✅ SECURITY: Recent clients data - apply role-based filtering

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "5");

    // Role-based data selection
    let select;
    switch (user.role) {
      case Role.ADMIN:
        select = {
          id: true,
          name: true,
          email: true,
          phone: true,
          cnpjCpf: true,
        };
        break;
      case Role.MODERATOR:
        select = {
          id: true,
          name: true,
          email: true,
          phone: true,
          cnpjCpf: true,
        };
        break;
      case Role.USER:
        select = {
          id: true,
          name: true,
          email: true,
          phone: true,
        };
        break;
      default:
        throw new ApiAuthError('Invalid user role', 403);
    }

    const recentClients = await prisma.client.findMany({
      take: limit,
      orderBy: {
        id: "desc",
      },
      select,
    });

    return NextResponse.json({
      data: recentClients,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}