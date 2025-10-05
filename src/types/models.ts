/**
 * Core data models for Alphabook application
 */

export interface Client {
  id: number
  name: string
  cnpjCpf: string
  phone: string
  email: string
  address: string
  active?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface Center {
  id: number
  name: string
  type: string
  obs: string
  active?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Order status enum matching Prisma schema
export type OrderStatus = 
  | 'PENDING'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'ON_HOLD'

// Order type enum matching Prisma schema
export type OrderType = 
  | 'BUDGET_DERIVED'
  | 'DIRECT_ORDER'
  | 'RUSH_ORDER'

// Budget status enum matching Prisma schema
export type BudgetStatus = 
  | 'DRAFT'
  | 'SUBMITTED' 
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'CANCELLED'

export interface Order {
  id: number
  clientId: number
  centerId: number
  budgetId?: number | null
  orderType: OrderType
  title: string
  tiragem: number
  formato: string
  numPaginasTotal: number
  numPaginasColoridas: number
  valorUnitario: number
  valorTotal: number
  prazoEntrega: string
  obs: string
  date: Date | string
  status: OrderStatus
  
  // Extended fields
  numero_pedido?: string | null
  data_pedido?: Date | string | null
  data_entrega?: Date | string | null
  solicitante?: string | null
  documento?: string | null
  editorial?: string | null
  tipo_produto?: string | null
  cor_miolo?: string | null
  papel_miolo?: string | null
  papel_capa?: string | null
  cor_capa?: string | null
  laminacao?: string | null
  acabamento?: string | null
  shrink?: string | null
  pagamento?: string | null
  frete?: string | null
  
  // Relations
  client?: Client
  center?: Center
  budget?: Budget | null
}

export interface Budget {
  id: number
  clientId?: number | null
  centerId?: number | null
  status: BudgetStatus
  
  // Core fields
  numero_pedido?: string | null
  data_pedido: Date | string
  data_entrega?: Date | string | null
  solicitante?: string | null
  documento?: string | null
  editorial?: string | null
  tipo_produto?: string | null
  titulo: string
  tiragem: number
  formato: string
  total_pgs: number
  pgs_colors: number
  cor_miolo?: string | null
  papel_miolo?: string | null
  papel_capa?: string | null
  cor_capa?: string | null
  laminacao?: string | null
  acabamento?: string | null
  shrink?: string | null
  centro_producao?: string | null
  observacoes?: string | null
  preco_unitario: number
  preco_total: number
  prazo_producao?: string | null
  pagamento?: string | null
  frete?: string | null
  
  // Audit trail fields
  submittedAt?: Date | string | null
  approvedAt?: Date | string | null
  rejectedAt?: Date | string | null
  cancelledAt?: Date | string | null
  convertedAt?: Date | string | null
  approvedById?: number | null
  rejectedById?: number | null
  
  // Legacy compatibility
  approved?: boolean
  
  // Relations
  client?: Client | null
  center?: Center | null
  order?: Order | null
  approvedBy?: User | null
  rejectedBy?: User | null
}

// User role enum
export type Role = 
  | 'USER'
  | 'MODERATOR'
  | 'ADMIN'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  createdAt?: Date | string
  updatedAt?: Date | string
  
  // Relations for budget approval tracking
  budgetsApproved?: Budget[]
  budgetsRejected?: Budget[]
}

export interface DashboardSummary {
  totalClients: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

export interface RecentOrder extends Pick<Order, 'id' | 'title' | 'valorTotal' | 'status' | 'date' | 'numero_pedido'> {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone'>
  center: Pick<Center, 'id' | 'name'>
}

export type RecentClient = Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'cnpjCpf'>;

// Order status change payload
export interface OrderStatusChange {
  status: OrderStatus
  reason?: string
  timestamp?: Date | string
  changedBy?: number
}