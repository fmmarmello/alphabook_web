import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types/models"

interface StatusBadgeProps {
  status: OrderStatus | string
  className?: string
}

const statusStyles: Record<string, string> = {
  'Pendente': 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  'Em produção': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  'Finalizado': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Entregue': 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  'Cancelado': 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'Concluído': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Em Andamento': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20'
  
  return (
    <Badge variant="outline" className={cn(style, 'font-medium', className)}>
      {status}
    </Badge>
  )
}
