import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const user = getAuthenticatedUser(request);
    
    // ✅ SECURITY: Role-based data filtering for dashboard
    let data;
    
    switch (user.role) {
      case Role.ADMIN:
        // Admins see complete dashboard with financial data
        const [clientsCount, ordersCount, totalRevenue, pendingOrdersCount] = await Promise.all([
          prisma.client.count(),
          prisma.order.count(),
          prisma.order.aggregate({
            _sum: {
              valorTotal: true,
            },
          }),
          prisma.order.count({
            where: {
              status: "Pendente",
            },
          }),
        ]);

        data = {
          totalClients: clientsCount,
          totalOrders: ordersCount,
          totalRevenue: totalRevenue._sum.valorTotal ?? 0, // Financial data visible to admins
          pendingOrders: pendingOrdersCount,
        };
        break;
        
      case Role.MODERATOR:
        // Moderators see dashboard with limited financial data
        const [modClientsCount, modOrdersCount, modPendingOrdersCount] = await Promise.all([
          prisma.client.count(),
          prisma.order.count(),
          prisma.order.count({
            where: {
              status: "Pendente",
            },
          }),
        ]);

        data = {
          totalClients: modClientsCount,
          totalOrders: modOrdersCount,
          totalRevenue: 0, // Financial data hidden from moderators in MVP
          pendingOrders: modPendingOrdersCount,
        };
        break;
        
      case Role.USER:
        // Users see limited dashboard, NO financial data
        const [userOrdersCount, userPendingOrdersCount] = await Promise.all([
          prisma.order.count(),
          prisma.order.count({
            where: {
              status: "Pendente",
            },
          }),
        ]);

        data = {
          totalClients: 0, // Hidden from users
          totalOrders: userOrdersCount,
          totalRevenue: 0, // ✅ CRITICAL: Financial data hidden from users
          pendingOrders: userPendingOrdersCount,
        };
        break;
        
      default:
        throw new ApiAuthError('Invalid user role', 403);
    }

    return NextResponse.json({
      data,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}