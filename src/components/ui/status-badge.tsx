import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus, BudgetStatus } from "@/types/models"

interface StatusBadgeProps {
  status: OrderStatus | BudgetStatus | string
  className?: string
  type?: 'order' | 'budget'
}

// Order status translations from enum values to Portuguese labels
const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  IN_PRODUCTION: "Em produção",
  COMPLETED: "Concluído",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  ON_HOLD: "Em Andamento"
}

const orderStatusStyles: Record<string, string> = {
  'Pendente': 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  'Em produção': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  'Finalizado': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Entregue': 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  'Cancelado': 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'Concluído': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Em Andamento': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
}

const budgetStatusStyles: Record<string, string> = {
  'DRAFT': 'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
  'SUBMITTED': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  'APPROVED': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'REJECTED': 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'CONVERTED': 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  'CANCELLED': 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
}

const budgetStatusLabels: Record<string, string> = {
  'DRAFT': 'Rascunho',
  'SUBMITTED': 'Enviado',
  'APPROVED': 'Aprovado',
  'REJECTED': 'Rejeitado',
  'CONVERTED': 'Convertido',
  'CANCELLED': 'Cancelado',
}

export function StatusBadge({ status, className, type = 'order' }: StatusBadgeProps) {
  let label: string
  let style: string

  if (type === 'budget') {
    label = budgetStatusLabels[status] || status
    style = budgetStatusStyles[status] || 'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20'
  } else {
    // For orders, translate enum values to Portuguese labels first
    label = orderStatusLabels[status as OrderStatus] || status
    style = orderStatusStyles[label] || orderStatusStyles['Pendente'] || 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20'

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[StatusBadge] Order status:', {
        original: status,
        translated: label,
        styleFound: !!orderStatusStyles[label],
        finalStyle: style
      })
    }
  }

  return (
    <Badge variant="outline" className={cn(style, 'font-medium', className)}>
      {label}
    </Badge>
  )
}
