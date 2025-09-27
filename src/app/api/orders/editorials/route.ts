
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, serverError } from '@/lib/api-response';

export async function GET() {
  try {
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

    return ok(editorialList);
  } catch (error) {
    return serverError('An error occurred while fetching editorials.');
  }
}
