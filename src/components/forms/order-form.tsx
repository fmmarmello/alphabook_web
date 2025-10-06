"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { OrderCreationSchema } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, CheckCircle2, DollarSign, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { OrderStatusDialog } from "@/components/ui/order-status-dialog";
import type { Order, Client, Center, Budget, OrderStatus, OrderType } from "@/types/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderFormProps {
  mode: 'create' | 'edit';
  initialData?: Order;
  budgetId?: string; // For budget conversion mode
}

type OrderFormValues = z.input<typeof OrderCreationSchema>;

// Extended budget interface for dropdown selection
interface ApprovedBudget extends Omit<Budget, 'client' | 'center'> {
  client?: Pick<Client, 'id' | 'name'>;
  center?: Pick<Center, 'id' | 'name'>;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (DATE_ONLY_REGEX.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
  }
  return undefined;
};

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  BUDGET_DERIVED: "Derivado de Orçamento",
  DIRECT_ORDER: "Ordem Direta",
  RUSH_ORDER: "Ordem Urgente"
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  IN_PRODUCTION: "Em Produção",
  COMPLETED: "Concluído", 
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  ON_HOLD: "Em Espera"
};

const mapOrderDefaults = (order: Order): OrderFormValues => ({
  clientId: order.clientId,
  centerId: order.centerId,
  budgetId: order.budgetId || undefined,
  title: order.title,
  tiragem: order.tiragem,
  formato: order.formato,
  numPaginasTotal: order.numPaginasTotal,
  numPaginasColoridas: order.numPaginasColoridas,
  valorUnitario: Number(order.valorUnitario ?? 0),
  valorTotal: Number(order.valorTotal ?? 0),
  prazoEntrega: toDateInputValue(order.prazoEntrega) ?? "",
  obs: order.obs ?? "",
  numero_pedido: order.numero_pedido ?? undefined,
  data_pedido: toDateInputValue(order.data_pedido),
  data_entrega: toDateInputValue(order.data_entrega),
  solicitante: order.solicitante ?? undefined,
  documento: order.documento ?? undefined,
  editorial: order.editorial ?? undefined,
  tipo_produto: order.tipo_produto ?? undefined,
  cor_miolo: order.cor_miolo ?? undefined,
  papel_miolo: order.papel_miolo ?? undefined,
  papel_capa: order.papel_capa ?? undefined,
  cor_capa: order.cor_capa ?? undefined,
  laminacao: order.laminacao ?? undefined,
  acabamento: order.acabamento ?? undefined,
  shrink: order.shrink ?? undefined,
  pagamento: order.pagamento ?? undefined,
  frete: order.frete ?? undefined,
});

const mapBudgetToOrderDefaults = (budget: ApprovedBudget): Partial<OrderFormValues> => ({
  clientId: budget.clientId || undefined,
  centerId: budget.centerId || undefined,
  budgetId: budget.id,
  title: budget.titulo,
  tiragem: budget.tiragem,
  formato: budget.formato,
  numPaginasTotal: budget.total_pgs,
  numPaginasColoridas: budget.pgs_colors,
  valorUnitario: Number(budget.preco_unitario ?? 0),
  valorTotal: Number(budget.preco_total ?? 0),
  prazoEntrega: budget.prazo_producao || "",
  obs: budget.observacoes || "",
  numero_pedido: budget.numero_pedido || undefined,
  data_pedido: toDateInputValue(budget.data_pedido),
  data_entrega: toDateInputValue(budget.data_entrega),
  solicitante: budget.solicitante || undefined,
  documento: budget.documento || undefined,
  editorial: budget.editorial || undefined,
  tipo_produto: budget.tipo_produto || undefined,
  cor_miolo: budget.cor_miolo || undefined,
  papel_miolo: budget.papel_miolo || undefined,
  papel_capa: budget.papel_capa || undefined,
  cor_capa: budget.cor_capa || undefined,
  laminacao: budget.laminacao || undefined,
  acabamento: budget.acabamento || undefined,
  shrink: budget.shrink || undefined,
  pagamento: budget.pagamento || undefined,
  frete: budget.frete || undefined,
});

export function OrderForm({ mode, initialData, budgetId }: OrderFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [serverError, setServerError] = useState("");
  const [clients, setClients] = useState<Pick<Client, 'id' | 'name'>[]>([]);
  const [centers, setCenters] = useState<Pick<Center, 'id' | 'name'>[]>([]);
  const [approvedBudgets, setApprovedBudgets] = useState<ApprovedBudget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<ApprovedBudget | null>(null);
  const [workflowMode, setWorkflowMode] = useState<'budget' | 'direct'>('direct');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [currentOrderStatus, setCurrentOrderStatus] = useState<OrderStatus>(initialData?.status || 'PENDING');

  // Check if user has permission to create direct orders (MODERATOR+ only)
  const canCreateDirectOrder = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  // Determine initial workflow mode
  const initialWorkflowMode = useMemo(() => {
    if (budgetId || initialData?.budgetId) return 'budget';
    if (mode === 'edit') return initialData?.orderType === 'BUDGET_DERIVED' ? 'budget' : 'direct';
    return canCreateDirectOrder ? 'direct' : 'budget';
  }, [budgetId, initialData, mode, canCreateDirectOrder]);

  const formDefaultValues = useMemo(() => {
    if (mode === 'edit' && initialData) {
      return mapOrderDefaults(initialData);
    }
    if (budgetId && selectedBudget) {
      return mapBudgetToOrderDefaults(selectedBudget);
    }
    return undefined;
  }, [initialData, mode, budgetId, selectedBudget]);

  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting } 
  } = useForm<OrderFormValues>({
    resolver: zodResolver(OrderCreationSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  const watchedBudgetId = watch('budgetId');

  // Initialize workflow mode
  useEffect(() => {
    setWorkflowMode(initialWorkflowMode);
  }, [initialWorkflowMode]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, centersRes, budgetsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/centers'),
          fetch('/api/budgets?status=APPROVED'),
        ]);

        const [clientsData, centersData, budgetsData] = await Promise.all([
          clientsRes.json(),
          centersRes.json(), 
          budgetsRes.json(),
        ]);

        setClients(clientsData.data.map((c: Client) => ({ id: c.id, name: c.name })));
        setCenters(centersData.data.map((c: Center) => ({ id: c.id, name: c.name })));
        setApprovedBudgets(budgetsData.data || []);

        // If editing and has budgetId, find the budget
        if (mode === 'edit' && initialData?.budgetId) {
          const budget = budgetsData.data?.find((b: ApprovedBudget) => b.id === initialData.budgetId);
          if (budget) {
            setSelectedBudget(budget);
          }
        }

        // If creating from budgetId, find and select the budget
        if (budgetId) {
          const budget = budgetsData.data?.find((b: ApprovedBudget) => b.id === parseInt(budgetId));
          if (budget) {
            setSelectedBudget(budget);
            const budgetDefaults = mapBudgetToOrderDefaults(budget);
            Object.entries(budgetDefaults).forEach(([key, value]) => {
              if (value !== undefined) {
                setValue(key as keyof OrderFormValues, value);
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        setServerError("Erro ao carregar dados necessários");
      }
    };
    fetchData();
  }, [budgetId, mode, initialData, setValue]);

  // Handle budget selection change
  useEffect(() => {
    if (workflowMode === 'budget' && watchedBudgetId && approvedBudgets.length > 0) {
      const budget = approvedBudgets.find(b => b.id === watchedBudgetId);
      if (budget && budget.id !== selectedBudget?.id) {
        setSelectedBudget(budget);
        // Pre-populate form with budget data
        const budgetDefaults = mapBudgetToOrderDefaults(budget);
        Object.entries(budgetDefaults).forEach(([key, value]) => {
          if (value !== undefined) {
            setValue(key as keyof OrderFormValues, value);
          }
        });
      }
    }
  }, [watchedBudgetId, approvedBudgets, workflowMode, selectedBudget, setValue]);

  const onSubmit = async (data: OrderFormValues) => {
    setServerError("");
    try {
      // Prepare submission data based on workflow mode
      const submitData = {
        ...data,
        orderType: workflowMode === 'budget' ? 'BUDGET_DERIVED' : 'DIRECT_ORDER'
      };

      const url = mode === 'create' 
        ? '/api/orders' 
        : `/api/orders/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} ordem.`);
      }

      toast.success(`Ordem ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso!`);
      router.push('/orders');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  const handleWorkflowModeChange = (newMode: string) => {
    const mode = newMode as 'budget' | 'direct';
    setWorkflowMode(mode);
    setSelectedBudget(null);
    
    // Reset form with appropriate defaults
    if (mode === 'direct') {
      reset({
        budgetId: undefined,
        clientId: undefined,
        centerId: undefined,
      });
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    setCurrentOrderStatus(newStatus);
    // Optionally refresh the order data here if needed
  };

  const isReadOnlyField = (fieldName: string) => {
    if (mode === 'edit') return false;
    if (workflowMode === 'budget' && selectedBudget) {
      return ['clientId', 'centerId'].includes(fieldName);
    }
    return false;
  };

  return (
    <div className="max-w-6xl w-full space-y-6">
      {/* Workflow Mode Selection */}
      {mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Criação de Ordem</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={workflowMode} onValueChange={handleWorkflowModeChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="budget" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Converter Orçamento
                </TabsTrigger>
                <TabsTrigger 
                  value="direct" 
                  className="flex items-center gap-2"
                  disabled={!canCreateDirectOrder}
                >
                  <User className="h-4 w-4" />
                  Ordem Direta
                  {!canCreateDirectOrder && <span className="text-xs">(Moderador+)</span>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="budget" className="mt-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Conversão de Orçamento Aprovado</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selecione um orçamento aprovado para converter em ordem de produção. 
                    Os dados serão pré-preenchidos automaticamente.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="direct" className="mt-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Ordem Direta</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Crie uma ordem de produção diretamente sem orçamento prévio. 
                    Todos os campos devem ser preenchidos manualmente.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Main Order Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {mode === 'create' ? 'Nova Ordem de Produção' : 'Editar Ordem de Produção'}
            </CardTitle>
            {initialData && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {ORDER_TYPE_LABELS[initialData.orderType]}
                </Badge>
                <Badge 
                  variant={currentOrderStatus === 'PENDING' ? 'secondary' : 
                          currentOrderStatus === 'COMPLETED' ? 'default' :
                          currentOrderStatus === 'CANCELLED' ? 'destructive' : 'outline'}
                >
                  {ORDER_STATUS_LABELS[currentOrderStatus]}
                </Badge>
              </div>
            )}
          </div>
          {mode === 'edit' && initialData && (
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(true)}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Alterar Status
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {serverError && <ErrorAlert message={serverError} className="mb-4" />}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Budget Selection (Budget Mode Only) */}
            {workflowMode === 'budget' && (
              <div className="space-y-4">
                <FormField>
                  <Label htmlFor="budgetId">Orçamento Aprovado *</Label>
                  <Select 
                    onValueChange={(value) => setValue('budgetId', parseInt(value))} 
                    defaultValue={budgetId || (initialData?.budgetId ? String(initialData.budgetId) : undefined)}
                    disabled={mode === 'edit'} // Can't change budget in edit mode
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um orçamento aprovado" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedBudgets.map(budget => (
                        <SelectItem key={budget.id} value={budget.id.toString()}>
                          <div className="flex flex-col">
                            <span>{budget.titulo}</span>
                            <span className="text-xs text-muted-foreground">
                              {budget.client?.name} • R$ {budget.preco_total.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.budgetId?.message && <p className="text-sm text-destructive">{errors.budgetId.message}</p>}
                </FormField>

                {selectedBudget && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Detalhes do Orçamento</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="ml-2">{selectedBudget.client?.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Centro:</span>
                        <span className="ml-2">{selectedBudget.center?.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="ml-2">R$ {selectedBudget.preco_total.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tiragem:</span>
                        <span className="ml-2">{selectedBudget.tiragem}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />
              </div>
            )}

            {/* Client and Center Selection (Direct Mode or when no budget selected) */}
            {(workflowMode === 'direct' || (workflowMode === 'budget' && !selectedBudget)) && (
              <FormGrid columns={2} gap="md">
                <FormField>
                  <Label htmlFor="clientId">Cliente *</Label>
                  <Select 
                    onValueChange={(value) => setValue('clientId', parseInt(value))} 
                    defaultValue={formDefaultValues?.clientId ? String(formDefaultValues.clientId) : undefined}
                    disabled={isReadOnlyField('clientId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId?.message && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="centerId">Centro *</Label>
                  <Select 
                    onValueChange={(value) => setValue('centerId', parseInt(value))} 
                    defaultValue={formDefaultValues?.centerId ? String(formDefaultValues.centerId) : undefined}
                    disabled={isReadOnlyField('centerId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.map(center => (
                        <SelectItem key={center.id} value={center.id.toString()}>{center.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.centerId?.message && <p className="text-sm text-destructive">{errors.centerId.message}</p>}
                </FormField>
              </FormGrid>
            )}

            {/* Order Details */}
            <FormField>
              <Label htmlFor="title">Título *</Label>
              <Input id="title" placeholder="Título da ordem" {...register('title')} />
              {errors.title?.message && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </FormField>

            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="tiragem">Tiragem *</Label>
                <Input id="tiragem" type="number" placeholder="0" {...register('tiragem', { valueAsNumber: true })} />
                {errors.tiragem?.message && <p className="text-sm text-destructive">{errors.tiragem.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="formato">Formato *</Label>
                <Input id="formato" placeholder="Ex: 21x28cm" {...register('formato')} />
                {errors.formato?.message && <p className="text-sm text-destructive">{errors.formato.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="prazoEntrega">Prazo de Entrega *</Label>
                <Input id="prazoEntrega" type="date" {...register('prazoEntrega')} />
                {errors.prazoEntrega?.message && <p className="text-sm text-destructive">{errors.prazoEntrega.message}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="numPaginasTotal">Páginas Totais *</Label>
                <Input id="numPaginasTotal" type="number" placeholder="0" {...register('numPaginasTotal', { valueAsNumber: true })} />
                {errors.numPaginasTotal?.message && <p className="text-sm text-destructive">{errors.numPaginasTotal.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="numPaginasColoridas">Páginas Coloridas *</Label>
                <Input id="numPaginasColoridas" type="number" placeholder="0" {...register('numPaginasColoridas', { valueAsNumber: true })} />
                {errors.numPaginasColoridas?.message && <p className="text-sm text-destructive">{errors.numPaginasColoridas.message}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="valorUnitario">Valor Unitário *</Label>
                <Input id="valorUnitario" type="number" step="0.01" placeholder="0.00" {...register('valorUnitario', { valueAsNumber: true })} />
                {errors.valorUnitario?.message && <p className="text-sm text-destructive">{errors.valorUnitario.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="valorTotal">Valor Total *</Label>
                <Input id="valorTotal" type="number" step="0.01" placeholder="0.00" {...register('valorTotal', { valueAsNumber: true })} />
                {errors.valorTotal?.message && <p className="text-sm text-destructive">{errors.valorTotal.message}</p>}
              </FormField>
            </FormGrid>

            <FormField>
              <Label htmlFor="obs">Observações</Label>
              <Input id="obs" placeholder="Observações sobre a ordem" {...register('obs')} />
              {errors.obs?.message && <p className="text-sm text-destructive">{errors.obs.message}</p>}
            </FormField>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/orders')} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 
                  (workflowMode === 'budget' ? 'Converter em Ordem' : 'Criar Ordem') : 
                  'Salvar Alterações'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      {mode === 'edit' && initialData && (
        <OrderStatusDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          orderId={initialData.id}
          currentStatus={currentOrderStatus}
          onStatusChanged={handleStatusChange}
        />
      )}
    </div>
  );
}
