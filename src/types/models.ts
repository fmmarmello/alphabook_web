/**
 * Shared application types re-exported from Prisma to keep runtime models
 * aligned with the database schema.
 */

import type {
  Prisma,
  Budget,
  BudgetStatus,
  Center,
  Client,
  Order,
  OrderStatus,
  OrderType,
  Role,
  User,
} from '@/generated/prisma';

export type {
  Budget,
  BudgetStatus,
  Center,
  Client,
  Order,
  OrderStatus,
  OrderType,
  Role,
  User,
};

export type BudgetWithRelations = Prisma.BudgetGetPayload<{
  include: {
    client: true;
    center: true;
    order: true;
    approvedBy: true;
    rejectedBy: true;
  };
}>;

export type OrderWithBudget = Prisma.OrderGetPayload<{
  include: {
    budget: {
      include: {
        client: true;
        center: true;
        approvedBy: true;
        rejectedBy: true;
      };
    };
  };
}>;

export interface DashboardSummary {
  totalClients: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export type RecentOrder = {
  id: number;
  numero_pedido: string;
  status: OrderStatus;
  data_pedido: Date | string;
  budget: {
    id: number;
    titulo: string;
    status: BudgetStatus;
    data_entrega: Date | string | null;
    preco_total?: number;
    preco_unitario?: number;
    client: Pick<Client, 'id' | 'name' | 'email' | 'phone'> | null;
    center: Pick<Center, 'id' | 'name' | 'type'> | null;
  } | null;
};

export type RecentClient = Pick<
  Client,
  'id' | 'name' | 'email' | 'phone' | 'cnpjCpf'
>;

export interface OrderStatusChange {
  status: OrderStatus;
  reason?: string;
  timestamp?: Date | string;
  changedBy?: string | number;
}
