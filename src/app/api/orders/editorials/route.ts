
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    await requireApiAuth(req);
    
    // ✅ SECURITY: All authenticated users can access editorials list
    
    const editorials = await prisma.order.findMany({
      select: {
        editorial: true,
      },
      distinct: ['editorial'],
      where: {
        editorial: {
          not: null,
        },
      },
    });

    const editorialList = editorials.map((e) => e.editorial).filter(Boolean) as string[];

    return NextResponse.json({
      data: editorialList,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
