"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BudgetSchema, BudgetInput } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorAlert } from "@/components/ui/error-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loader2, Search, CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatCurrencyBRL, parseCurrencyBRL } from "@/lib/utils";
import type { Budget, Client, Center, BudgetStatus } from "@/types/models";

interface BudgetFormProps {
  mode: 'create' | 'edit';
  initialData?: Budget;
  specifications?: Record<string, string[]>;
}

interface ClientOption {
  id: number;
  name: string;
  cnpjCpf: string;
  email: string;
}

interface CenterOption {
  id: number;
  name: string;
  type: string;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) return "";
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
  return "";
};

const mapBudgetDefaults = (budget: Budget): BudgetInput => ({
  clientId: budget.clientId || 0, // Fallback to 0 if null, will be handled by form validation
  centerId: budget.centerId || 0, // Fallback to 0 if null, will be handled by form validation
  numero_pedido: budget.numero_pedido ?? undefined,
  data_pedido: toDateInputValue(budget.data_pedido) ?? "",
  data_entrega: toDateInputValue(budget.data_entrega),
  solicitante: budget.solicitante ?? undefined,
  documento: budget.documento ?? undefined,
  editorial: budget.editorial ?? undefined,
  tipo_produto: budget.tipo_produto ?? undefined,
  titulo: budget.titulo,
  tiragem: budget.tiragem,
  formato: budget.formato,
  total_pgs: budget.total_pgs,
  pgs_colors: budget.pgs_colors,
  cor_miolo: budget.cor_miolo ?? undefined,
  papel_miolo: budget.papel_miolo ?? undefined,
  papel_capa: budget.papel_capa ?? undefined,
  cor_capa: budget.cor_capa ?? undefined,
  laminacao: budget.laminacao ?? undefined,
  acabamento: budget.acabamento ?? undefined,
  shrink: budget.shrink ?? undefined,
  centro_producao: budget.centro_producao ?? undefined,
  observacoes: budget.observacoes ?? undefined,
  preco_unitario: Number(budget.preco_unitario ?? 0),
  preco_total: Number(budget.preco_total ?? 0),
  prazo_producao: budget.prazo_producao ?? undefined,
  pagamento: budget.pagamento ?? undefined,
  frete: budget.frete ?? undefined,
  status: budget.status,
  approved: budget.approved ?? false,
  orderId: budget.order?.id ?? undefined,
});

export function BudgetForm({ mode, initialData, specifications }: BudgetFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [serverError, setServerError] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [centerSearch, setCenterSearch] = useState("");
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  const formDefaultValues = useMemo<Partial<BudgetInput>>(() => {
    if (!initialData) {
      return { status: "DRAFT" };
    }
    return mapBudgetDefaults(initialData);
  }, [initialData]);

  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    control,
    formState: { errors, isValid, isSubmitting } 
  } = useForm<BudgetInput>({
    resolver: zodResolver(BudgetSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  // Auto compute total
  const tiragem = watch("tiragem") || 0;
  const preco_unitario = watch("preco_unitario") || 0;
  useEffect(() => {
    const total = (Number(tiragem) || 0) * (Number(preco_unitario) || 0);
    setValue("preco_total", total, { shouldValidate: true });
  }, [tiragem, preco_unitario, setValue]);

  // Fetch clients
  const fetchClients = useCallback(async (search = "") => {
    setClientsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("pageSize", "50");
      
      const res = await fetch(`/api/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  // Fetch centers
  const fetchCenters = useCallback(async (search = "") => {
    setCentersLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("pageSize", "50");
      
      const res = await fetch(`/api/centers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCenters(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
    } finally {
      setCentersLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchClients();
    fetchCenters();
  }, [fetchClients, fetchCenters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearch !== "") {
        fetchClients(clientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, fetchClients]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (centerSearch !== "") {
        fetchCenters(centerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [centerSearch, fetchCenters]);

  const currentStatus = initialData?.status ?? "DRAFT";
  const canEdit = currentStatus === "DRAFT" || currentStatus === "REJECTED";
  const canSubmit = currentStatus === "DRAFT";
  const canApprove = currentStatus === "SUBMITTED" && (user?.role === "MODERATOR" || user?.role === "ADMIN");
  const canConvert = currentStatus === "APPROVED";

  const onSubmit: SubmitHandler<BudgetInput> = async (data) => {
    setServerError("");
    try {
      const url = mode === 'create' 
        ? '/api/budgets' 
        : `/api/budgets/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} orçamento.`);
      }

      toast.success(`Orçamento ${mode === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
      router.push('/budgets');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  const handleWorkflowAction = async (action: string, data?: any) => {
    if (!initialData?.id) return;
    
    setIsSubmittingWorkflow(true);
    try {
      const res = await fetch(`/api/budgets/${initialData.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ao executar ação.`);
      }

      const actionLabels = {
        submit: 'enviado para aprovação',
        approve: 'aprovado',
        reject: 'rejeitado',
        'convert-to-order': 'convertido em pedido'
      };

      toast.success(`Orçamento ${actionLabels[action as keyof typeof actionLabels] || 'atualizado'} com sucesso!`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao executar ação.');
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  return (
    <Card className="max-w-5xl w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{mode === 'create' ? 'Novo Orçamento' : 'Editar Orçamento'}</CardTitle>
        {initialData && (
          <StatusBadge status={currentStatus} type="budget" />
        )}
      </CardHeader>
      <CardContent>
        {serverError && <ErrorAlert message={serverError} className="mb-4" />}
        
        {/* Workflow Actions */}
        {mode === 'edit' && initialData && (
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/50 rounded-lg">
            {canSubmit && (
              <Button 
                type="button"
                size="sm"
                onClick={() => handleWorkflowAction('submit')}
                disabled={isSubmittingWorkflow}
              >
                <FileText className="h-4 w-4 mr-2" />
                Enviar para Aprovação
              </Button>
            )}
            {canApprove && (
              <>
                <Button 
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => handleWorkflowAction('approve')}
                  disabled={isSubmittingWorkflow}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button 
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt('Motivo da rejeição:');
                    if (reason) handleWorkflowAction('reject', { reason });
                  }}
                  disabled={isSubmittingWorkflow}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}
            {canConvert && (
              <Button 
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleWorkflowAction('convert-to-order')}
                disabled={isSubmittingWorkflow}
              >
                <Clock className="h-4 w-4 mr-2" />
                Converter em Pedido
              </Button>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Client and Center Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Cliente e Centro de Produção</h3>
            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="clientId">Cliente *</Label>
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={clientsLoading ? "Carregando..." : "Selecione um cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="flex items-center px-3 pb-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Buscar cliente..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {client.cnpjCpf} • {client.email}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.clientId?.message && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="centerId">Centro de Produção *</Label>
                <Controller
                  name="centerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={centersLoading ? "Carregando..." : "Selecione um centro"} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="flex items-center px-3 pb-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Buscar centro..."
                            value={centerSearch}
                            onChange={(e) => setCenterSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={center.id.toString()}>
                            <div>
                              <div className="font-medium">{center.name}</div>
                              <div className="text-sm text-muted-foreground">{center.type}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.centerId?.message && <p className="text-sm text-destructive">{errors.centerId.message}</p>}
              </FormField>
            </FormGrid>
          </div>

          {/* Section 2: Project Identification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Identificação do Projeto</h3>
            <FormField>
              <Label htmlFor="titulo">Título *</Label>
              <Input 
                id="titulo" 
                placeholder="Nome do projeto/orçamento" 
                disabled={!canEdit}
                {...register('titulo')} 
              />
              {errors.titulo?.message && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
            </FormField>

            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="numero_pedido">Número do Pedido</Label>
                <Input
                  id="numero_pedido"
                  placeholder="Gerado automaticamente"
                  disabled={true}
                  {...register('numero_pedido')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O número do pedido será gerado automaticamente no formato 0001/202501
                </p>
              </FormField>

              <FormField>
                <Label htmlFor="solicitante">Solicitante</Label>
                <Input 
                  id="solicitante" 
                  placeholder="Nome de quem solicitou" 
                  disabled={!canEdit}
                  {...register('solicitante')} 
                />
              </FormField>

              <FormField>
                <Label htmlFor="documento">Documento</Label>
                <Input 
                  id="documento" 
                  placeholder="CPF/CNPJ do solicitante" 
                  disabled={!canEdit}
                  {...register('documento')} 
                />
              </FormField>
            </FormGrid>
          </div>

          {/* Section 3: Basic Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Especificações Básicas</h3>
            <FormGrid columns={4} gap="md">
              <FormField>
                <Label htmlFor="tiragem">Tiragem *</Label>
                <Input 
                  id="tiragem" 
                  type="number" 
                  min={1} 
                  placeholder="1000" 
                  disabled={!canEdit}
                  {...register('tiragem', { valueAsNumber: true })} 
                />
                {errors.tiragem?.message && <p className="text-sm text-destructive">{errors.tiragem.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="formato">Formato *</Label>
                {specifications?.["Formato Fechado"] ? (
                  <Select 
                    onValueChange={(value) => setValue('formato', value)} 
                    defaultValue={initialData?.formato}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specifications["Formato Fechado"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id="formato" 
                    placeholder="Ex: 21x28cm" 
                    disabled={!canEdit}
                    {...register('formato')} 
                  />
                )}
                {errors.formato?.message && <p className="text-sm text-destructive">{errors.formato.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="total_pgs">Nº de Páginas Total *</Label>
                <Input 
                  id="total_pgs" 
                  type="number" 
                  min={1} 
                  placeholder="100" 
                  disabled={!canEdit}
                  {...register('total_pgs', { valueAsNumber: true })} 
                />
                {errors.total_pgs?.message && <p className="text-sm text-destructive">{errors.total_pgs.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="pgs_colors">Nº de Páginas Coloridas</Label>
                <Input 
                  id="pgs_colors" 
                  type="number" 
                  min={0} 
                  placeholder="20" 
                  disabled={!canEdit}
                  {...register('pgs_colors', { valueAsNumber: true })} 
                />
                {errors.pgs_colors?.message && <p className="text-sm text-destructive">{errors.pgs_colors.message}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="tipo_produto">Tipo de Produto</Label>
                {specifications?.["Tipo de produto"] ? (
                  <Select 
                    onValueChange={(value) => setValue('tipo_produto', value)} 
                    defaultValue={initialData?.tipo_produto || undefined}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specifications["Tipo de produto"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id="tipo_produto" 
                    placeholder="Tipo de produto" 
                    disabled={!canEdit}
                    {...register('tipo_produto')} 
                  />
                )}
              </FormField>

              <FormField>
                <Label htmlFor="editorial">Editorial</Label>
                <Input 
                  id="editorial" 
                  placeholder="Grupo editorial" 
                  disabled={!canEdit}
                  {...register('editorial')} 
                />
              </FormField>
            </FormGrid>
          </div>

          {/* Section 4: Business Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Condições Comerciais</h3>
            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="preco_unitario">Valor Unitário * (R$)</Label>
                <Controller
                  name="preco_unitario"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="preco_unitario"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      disabled={!canEdit}
                      value={formatCurrencyBRL(Number(field.value) || 0)}
                      onChange={(e) => {
                        const num = parseCurrencyBRL(e.target.value);
                        field.onChange(num);
                      }}
                    />
                  )}
                />
                {errors.preco_unitario?.message && <p className="text-sm text-destructive">{errors.preco_unitario.message}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="preco_total">Valor Total (R$)</Label>
                <Controller
                  name="preco_total"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="preco_total"
                      type="text"
                      readOnly
                      className="bg-gray-50"
                      value={formatCurrencyBRL(Number(field.value) || 0)}
                    />
                  )}
                />
              </FormField>

              <FormField>
                <Label htmlFor="pagamento">Forma de Pagamento</Label>
                {specifications?.["Forma de pagamento"] ? (
                  <Select 
                    onValueChange={(value) => setValue('pagamento', value)} 
                    defaultValue={initialData?.pagamento || undefined}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specifications["Forma de pagamento"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id="pagamento" 
                    placeholder="Forma de pagamento" 
                    disabled={!canEdit}
                    {...register('pagamento')} 
                  />
                )}
              </FormField>
            </FormGrid>
          </div>

          {/* Section 5: Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Prazos</h3>
            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="data_pedido">Data do Pedido</Label>
                <Input 
                  id="data_pedido" 
                  type="date" 
                  disabled={!canEdit}
                  {...register('data_pedido')} 
                />
              </FormField>

              <FormField>
                <Label htmlFor="data_entrega">Data de Entrega</Label>
                <Input 
                  id="data_entrega" 
                  type="date" 
                  disabled={!canEdit}
                  {...register('data_entrega')} 
                />
              </FormField>

              <FormField>
                <Label htmlFor="prazo_producao">Prazo de Produção</Label>
                <Input 
                  id="prazo_producao" 
                  type="date" 
                  disabled={!canEdit}
                  {...register('prazo_producao')} 
                />
              </FormField>
            </FormGrid>
          </div>

          {/* Section 6: Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informações Adicionais</h3>
            <FormField>
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                rows={3}
                placeholder="Observações gerais sobre o orçamento..."
                disabled={!canEdit}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('observacoes')}
              />
            </FormField>
          </div>

          <div className="flex gap-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/budgets')} disabled={isSubmitting}>
              Cancelar
            </Button>
            {canEdit && (
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Criar Orçamento' : 'Salvar Alterações'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
