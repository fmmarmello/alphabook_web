// src/components/ui/status-badge.tsx - UPDATE INTERFACE

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string; // ✅ ADD this prop
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    // Budget statuses
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CONVERTED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
        
      // Order statuses
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PRODUCTION':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    // ✅ Default labels if no custom label provided
    const defaultLabels = {
      // Budget
      'DRAFT': 'Rascunho',
      'SUBMITTED': 'Enviado',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'CONVERTED': 'Convertido',
      'CANCELLED': 'Cancelado',
      // Order
      'PENDING': 'Pendente',
      'IN_PRODUCTION': 'Em Produção',
      'COMPLETED': 'Concluída',
      'DELIVERED': 'Entregue',
      'ON_HOLD': 'Em Espera'
    };
    
    return defaultLabels[status as keyof typeof defaultLabels] || status;
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        getStatusStyles(status),
        className
      )}
    >
      {label || getStatusLabel(status)}
    </span>
  );
}
