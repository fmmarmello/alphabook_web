// src/app/budgets/[id]/edit/form.tsx - ATUALIZAR ARQUIVO EXISTENTE

"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/forms/budget-form";
import { Package, CheckCircle, Loader2 } from "lucide-react";
import type { BudgetWithRelations } from "@/types/models";
import type { Specifications } from "@/lib/specifications";

interface EditBudgetFormProps {
  budget: BudgetWithRelations;
  specifications: Specifications | null;
}

export default function EditBudgetForm({ budget, specifications }: EditBudgetFormProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertToOrder = async () => {
    if (!budget?.id) return;
    
    setIsConverting(true);
    try {
      const response = await fetch(`/api/budgets/${budget.id}/convert-to-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          obs_producao: '', 
          responsavel_producao: '' 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || 'Erro ao converter orçamento');
      }

      const { data } = await response.json();
      toast.success('Ordem criada com sucesso!');
      router.push(`/orders/${data.id}/edit`);
    } catch (error) {
      console.error('Convert error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao converter orçamento');
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = budget.status === 'APPROVED' && !budget.order;
  const existingOrder = budget.order;

  return (
    <div className="space-y-6">
      {/* Convert to Order Button */}
      {canConvert && (
        <div className="flex justify-end">
          <Button 
            onClick={handleConvertToOrder}
            disabled={isConverting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Converter em Ordem de Produção
              </>
            )}
          </Button>
        </div>
      )}

      {/* Show if already converted */}
      {existingOrder && (
        <div className="flex items-center justify-end p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">
            Já convertido em ordem #{existingOrder.numero_pedido}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-4"
            onClick={() => router.push(`/orders/${existingOrder.id}/edit`)}
          >
            Ver Ordem
          </Button>
        </div>
      )}

      {/* Budget Form */}
      <BudgetForm
        mode="edit"
        initialData={budget}
        specifications={specifications ?? undefined}
      />
    </div>
  );
}

