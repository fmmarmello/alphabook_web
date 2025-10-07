// src/components/forms/order-form.tsx - CREATE NEW FILE

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorAlert } from "@/components/ui/error-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loader2, Package, CheckCircle, XCircle, AlertCircle, Clock, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatCurrencyBRL } from "@/lib/utils";
import { z } from "zod";
// import type { Order, Budget } from "@/types/models";
// ✅ Use Prisma generated types instead of models.ts
import type { Order, Budget } from "@/generated/prisma";


const OrderSchema = z.object({
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'COMPLETED', 'DELIVERED', 'CANCELLED', 'ON_HOLD']),
  data_entrega_real: z.string().optional(),
  data_inicio_producao: z.string().optional(),
  data_fim_producao: z.string().optional(),
  obs_producao: z.string().optional(),
  frete_real: z.number().optional(),
  custo_adicional: z.number().optional(),
  responsavel_producao: z.string().optional()
});

type OrderInput = z.infer<typeof OrderSchema>;

interface OrderFormProps {
  mode: 'create' | 'edit';
  initialData?: Order & { budget: Budget & { client: any; center: any } };
  budgetId?: number;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'IN_PRODUCTION', label: 'Em Produção', icon: Package, color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Concluída', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'DELIVERED', label: 'Entregue', icon: Truck, color: 'bg-green-100 text-green-800' },
  { value: 'ON_HOLD', label: 'Em Espera', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
  { value: 'CANCELLED', label: 'Cancelada', icon: XCircle, color: 'bg-red-100 text-red-800' }
];

// Date helper functions
const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }
  return "";
};

const mapOrderDefaults = (order: OrderFormProps['initialData']): OrderInput => ({
  status: order?.status || 'PENDING',
  data_entrega_real: toDateInputValue(order?.data_entrega_real),
  data_inicio_producao: toDateInputValue(order?.data_inicio_producao),
  data_fim_producao: toDateInputValue(order?.data_fim_producao),
  obs_producao: order?.obs_producao || "",
  frete_real: order?.frete_real || undefined,
  custo_adicional: order?.custo_adicional || undefined,
  responsavel_producao: order?.responsavel_producao || ""
});

export function OrderForm({ mode, initialData, budgetId }: OrderFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [serverError, setServerError] = useState("");
  const [budget, setBudget] = useState<Budget & { client: any; center: any } | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(!!budgetId);

  const formDefaultValues = mode === 'edit' && initialData
    ? mapOrderDefaults(initialData)
    : { status: 'PENDING' as const };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting }
  } = useForm<OrderInput>({
    resolver: zodResolver(OrderSchema),
    mode: "onChange",
    defaultValues: formDefaultValues
  });

  // Fetch budget for create mode
  useEffect(() => {
    if (budgetId && mode === 'create') {
      const fetchBudget = async () => {
        try {
          const response = await fetch(`/api/budgets/${budgetId}`);
          if (response.ok) {
            const data = await response.json();
            setBudget(data.data);
          } else {
            toast.error('Erro ao carregar orçamento');
            router.push('/budgets');
          }
        } catch (error) {
          console.error('Error fetching budget:', error);
          toast.error('Erro ao carregar orçamento');
        } finally {
          setBudgetLoading(false);
        }
      };
      fetchBudget();
    }
  }, [budgetId, mode, router]);

  const displayBudget = initialData?.budget || budget;
  const canEdit = user?.role !== 'USER';

  const onSubmit = async (data: OrderInput) => {
    setServerError("");
    try {
      const url = mode === 'create'
        ? '/api/orders'
        : `/api/orders/${initialData?.id}`;
      
      const payload = mode === 'create'
        ? { ...data, budgetId }
        : data;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} ordem.`);
      }

      toast.success(`Ordem ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso!`);
      router.push('/orders');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  if (budgetLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando orçamento...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {mode === 'create' ? 'Nova Ordem de Produção' : 'Editar Ordem'}
          {initialData && (
            <StatusBadge status={initialData.status} className="ml-2" />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {serverError && <ErrorAlert message={serverError} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Informações do Orçamento (Read-only) */}
          {displayBudget && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                Informações do Orçamento (Origem)
              </h3>
              <FormGrid columns={2} gap="md">
                <FormField>
                  <Label>Cliente</Label>
                  <div className="font-medium text-gray-900">{displayBudget.client?.name}</div>
                  <div className="text-sm text-gray-600">{displayBudget.client?.cnpjCpf}</div>
                </FormField>

                <FormField>
                  <Label>Centro de Produção</Label>
                  <div className="font-medium text-gray-900">{displayBudget.center?.name}</div>
                  <div className="text-sm text-gray-600">{displayBudget.center?.type}</div>
                </FormField>

                <FormField>
                  <Label>Produto</Label>
                  <div className="font-medium text-gray-900">{displayBudget.titulo}</div>
                </FormField>

                <FormField>
                  <Label>Tiragem</Label>
                  <div className="font-medium text-gray-900">{displayBudget.tiragem?.toLocaleString()}</div>
                </FormField>

                <FormField>
                  <Label>Valor Total</Label>
                  <div className="font-medium text-gray-900">
                    {formatCurrencyBRL(displayBudget.preco_total)}
                  </div>
                </FormField>

                <FormField>
                  <Label>Data de Entrega Prevista</Label>
                  <div className="font-medium text-gray-900">
                    {displayBudget.data_entrega 
                      ? new Date(displayBudget.data_entrega).toLocaleDateString('pt-BR')
                      : 'Não definida'
                    }
                  </div>
                </FormField>
              </FormGrid>

              <div className="mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/budgets/${displayBudget.id}`)}
                >
                  Ver orçamento completo →
                </Button>
              </div>
            </div>
          )}

          {/* Informações da Ordem */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Gestão de Produção
            </h3>

            {/* Status e Responsável */}
            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="status">Status da Ordem *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status?.message && (
                  <span className="text-sm text-red-500">{errors.status.message}</span>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="responsavel_producao">Responsável Produção</Label>
                <Input
                  id="responsavel_producao"
                  placeholder="Nome do responsável"
                  disabled={!canEdit}
                  {...register('responsavel_producao')}
                />
              </FormField>
            </FormGrid>

            {/* Datas de Produção */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">
                Cronograma de Produção
              </h4>
              
              <FormGrid columns={3} gap="md">
                <FormField>
                  <Label htmlFor="data_inicio_producao">Início da Produção</Label>
                  <Input
                    id="data_inicio_producao"
                    type="date"
                    disabled={!canEdit}
                    {...register('data_inicio_producao')}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="data_fim_producao">Fim da Produção</Label>
                  <Input
                    id="data_fim_producao"
                    type="date"
                    disabled={!canEdit}
                    {...register('data_fim_producao')}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="data_entrega_real">Entrega Real</Label>
                  <Input
                    id="data_entrega_real"
                    type="date"
                    disabled={!canEdit}
                    {...register('data_entrega_real')}
                  />
                </FormField>
              </FormGrid>
            </div>

            {/* Custos */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">
                Custos Reais
              </h4>
              
              <FormGrid columns={2} gap="md">
                <FormField>
                  <Label htmlFor="frete_real">Frete Real (R$)</Label>
                  <Input
                    id="frete_real"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    disabled={!canEdit}
                    {...register('frete_real', { valueAsNumber: true })}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="custo_adicional">Custo Adicional (R$)</Label>
                  <Input
                    id="custo_adicional"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    disabled={!canEdit}
                    {...register('custo_adicional', { valueAsNumber: true })}
                  />
                </FormField>
              </FormGrid>
            </div>

            {/* Observações */}
            <FormField>
              <Label htmlFor="obs_producao">Observações de Produção</Label>
              <textarea
                id="obs_producao"
                rows={4}
                placeholder="Observações internas sobre a produção..."
                disabled={!canEdit}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('obs_producao')}
              />
            </FormField>
          </div>

          {/* Submit Button */}
          {canEdit && (
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  mode === 'create' ? 'Criar Ordem' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
