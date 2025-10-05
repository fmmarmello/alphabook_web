import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/rbac';
import { BudgetStatus, OrderStatus } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(request);
    
    // Count pending budgets (SUBMITTED status - waiting for approval)
    const pendingBudgetsCount = await prisma.budget.count({
      where: { 
        status: BudgetStatus.SUBMITTED 
      }
    });

    // Count active orders (IN_PRODUCTION and PENDING statuses)
    const activeOrdersCount = await prisma.order.count({
      where: { 
        status: {
          in: [OrderStatus.IN_PRODUCTION, OrderStatus.PENDING]
        }
      }
    });

    // Role-based count visibility
    const counts = {
      pendingBudgets: user.role === Role.USER ? 0 : pendingBudgetsCount,
      activeOrders: activeOrdersCount,
    };

    return NextResponse.json({
      data: counts,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}