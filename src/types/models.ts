/**
 * Core data models for Alphabook application
 * These types match the Prisma schema and API responses
 */

export interface Client {
  id: number
  name: string
  cnpjCpf: string
  phone: string
  email: string
  address: string
}

export interface Center {
  id: number
  name: string
  type: string
  obs: string
}

export interface Order {
  id: number
  clientId: number
  centerId: number
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
  
  // Optional fields
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
  status?: string
  
  // Relations
  client?: Client
  center?: Center
}

export interface Budget {
  id: number
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
  approved: boolean
  orderId?: number | null
  order?: Order | null
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

export interface RecentClient extends Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'cnpjCpf'> {}

export type OrderStatus = 
  | 'Pendente'
  | 'Em produção'
  | 'Finalizado'
  | 'Entregue'
  | 'Cancelado'