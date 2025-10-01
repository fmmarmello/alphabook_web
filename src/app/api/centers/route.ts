import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { CenterSchema } from "@/lib/validation";
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import type { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    getAuthenticatedUser(req);
    
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

    const where: Prisma.CenterWhereInput = {};
    if (q) where.OR = [{ name: { contains: q } }, { obs: { contains: q } }];
    if (type) where.type = type;

    const total = await prisma.center.count({ where });
    const data = await prisma.center.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
        sortBy: Object.keys(orderBy)[0],
        sortOrder,
        q,
        type,
      },
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(req);
    
    // ✅ SECURITY: Center creation requires MODERATOR or ADMIN role
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to create centers', 403);
    }

    const json = await req.json();
    const parsed = CenterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({
        error: {
          message: "Dados inválidos",
          details: parsed.error.flatten()
        }
      }, { status: 400 });
    }
    
    const center = await prisma.center.create({ data: parsed.data });
    
    return NextResponse.json({
      data: center,
      error: null
    }, { status: 201 });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
