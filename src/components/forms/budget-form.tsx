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
import { ProductionSpecificationsSection } from "./budget-form/ProductionSpecificationsSection";
import { featureFlags } from "@/lib/feature-flags";
import type { BudgetWithRelations } from "@/types/models";

interface BudgetFormProps {
  mode: 'create' | 'edit';
  initialData?: BudgetWithRelations;
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

const mapBudgetDefaults = (budget: BudgetWithRelations): BudgetInput => ({
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
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Novo Orçamento' : 'Editar Orçamento'}
          {initialData && (
            <StatusBadge status={initialData.status} className="ml-2" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {serverError && <ErrorAlert message={serverError} />}
        
        {/* Workflow Actions */}
        {mode === 'edit' && initialData && (
          <div className="flex gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
            {canSubmit && (
              <Button
                type="button"
                onClick={() => handleWorkflowAction('submit')}
                disabled={isSubmittingWorkflow}
              >
                {isSubmittingWorkflow ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Enviar para Aprovação
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  type="button"
                  onClick={() => handleWorkflowAction('approve')}
                  disabled={isSubmittingWorkflow}
                  variant="default"
                >
                  {isSubmittingWorkflow ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Aprovar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleWorkflowAction('reject')}
                  disabled={isSubmittingWorkflow}
                  variant="destructive"
                >
                  {isSubmittingWorkflow ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Rejeitar
                </Button>
              </>
            )}
            {canConvert && (
              <Button
                type="button"
                onClick={() => handleWorkflowAction('convert-to-order')}
                disabled={isSubmittingWorkflow}
                variant="outline"
              >
                {isSubmittingWorkflow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Converter em Pedido
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* SEÇÃO 1: Identificação (Quem & Onde) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Identificação
            </h3>
            <p className="text-sm text-gray-600">
              Cliente e centro responsável pelo projeto
            </p>

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
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Buscar cliente..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{client.name}</span>
                              <span className="text-sm text-gray-500">
                                {client.cnpjCpf} • {client.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.clientId?.message && (
                  <span className="text-sm text-red-500">{errors.clientId.message}</span>
                )}
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
                        <SelectValue placeholder="Selecione um centro" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Buscar centro..."
                            value={centerSearch}
                            onChange={(e) => setCenterSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={center.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{center.name}</span>
                              <span className="text-sm text-gray-500">{center.type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.centerId?.message && (
                  <span className="text-sm text-red-500">{errors.centerId.message}</span>
                )}
              </FormField>
            </FormGrid>
          </div>

          {/* SEÇÃO 2: Projeto (O Quê) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informações do Projeto
            </h3>
            <p className="text-sm text-gray-600">
              Detalhes e identificação do material a ser produzido
            </p>

            <FormField>
              <Label htmlFor="titulo">Título do Projeto *</Label>
              <Input
                id="titulo" 
                placeholder="Nome do projeto/orçamento" 
                disabled={!canEdit}
                {...register('titulo')} 
              />
              {errors.titulo?.message && (
                <span className="text-sm text-red-500">{errors.titulo.message}</span>
              )}
            </FormField>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="numero_pedido">Número do Pedido</Label>
                <Input
                  id="numero_pedido"
                  placeholder="Gerado automaticamente"
                  disabled={true}
                  {...register('numero_pedido')}
                />
                <p className="text-xs text-gray-500 mt-1">
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
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento" 
                  placeholder="CPF/CNPJ do solicitante" 
                  disabled={!canEdit}
                  {...register('documento')} 
                />
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

            <FormField>
              <Label htmlFor="tipo_produto">Tipo de Produto</Label>
              {specifications?.["Tipo de produto"] ? (
                <Select
                  onValueChange={(value) => setValue('tipo_produto', value)} 
                  defaultValue={initialData?.tipo_produto || undefined}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
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
          </div>

          {/* SEÇÃO 3: Especificações Técnicas (Como) */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Especificações Técnicas
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Características físicas e técnicas do material
              </p>
            </div>

            {/* Especificações Básicas */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">
                Dimensões e Quantidades
              </h4>
              
              <FormGrid columns={2} gap="md">
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
                  {errors.tiragem?.message && (
                    <span className="text-sm text-red-500">{errors.tiragem.message}</span>
                  )}
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
                        <SelectValue placeholder="Selecione o formato" />
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
                  {errors.formato?.message && (
                    <span className="text-sm text-red-500">{errors.formato.message}</span>
                  )}
                </FormField>
              </FormGrid>

              <FormGrid columns={2} gap="md">
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
                  {errors.total_pgs?.message && (
                    <span className="text-sm text-red-500">{errors.total_pgs.message}</span>
                  )}
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
                  {errors.pgs_colors?.message && (
                    <span className="text-sm text-red-500">{errors.pgs_colors.message}</span>
                  )}
                </FormField>
              </FormGrid>
            </div>

            {/* Especificações de Produção - Feature Flagged */}
            {featureFlags.isEnabled('PRODUCTION_SPECIFICATIONS') && (
              <ProductionSpecificationsSection
                control={control}
                setValue={setValue}
                watch={watch}
                errors={errors}
                specifications={specifications}
                initialData={initialData}
                disabled={mode === 'edit' && !canEdit}
              />
            )}
          </div>

          {/* SEÇÃO 4: Comercial & Prazos (Quanto & Quando) */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Condições Comerciais e Prazos
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Valores, pagamento e cronograma de entrega
              </p>
            </div>

            {/* Valores */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">
                Valores
              </h4>
              
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
                  {errors.preco_unitario?.message && (
                    <span className="text-sm text-red-500">{errors.preco_unitario.message}</span>
                  )}
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

                {featureFlags.isEnabled('FREIGHT_FIELD') && (
                  <FormField>
                    <Label htmlFor="frete">Valor do Frete (R$)</Label>
                    <Controller
                      name="frete"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="frete"
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          disabled={!canEdit}
                          value={field.value ? formatCurrencyBRL(parseCurrencyBRL(field.value)) : ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                          }}
                          data-testid="frete"
                        />
                      )}
                    />
                    {errors.frete && (
                      <span className="text-sm text-red-500">
                        {errors.frete.message}
                      </span>
                    )}
                  </FormField>
                )}
              </FormGrid>

              <FormField>
                <Label htmlFor="pagamento">Forma de Pagamento</Label>
                {specifications?.["Forma de pagamento"] ? (
                  <Select
                    onValueChange={(value) => setValue('pagamento', value)} 
                    defaultValue={initialData?.pagamento || undefined}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
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
            </div>

            {/* Prazos */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">
                Cronograma
              </h4>
              
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
          </div>

          {/* SEÇÃO 5: Informações Complementares */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informações Complementares
            </h3>
            <p className="text-sm text-gray-600">
              Observações e informações adicionais sobre o projeto
            </p>

            <FormField>
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                rows={4}
                placeholder="Observações gerais sobre o orçamento..."
                disabled={!canEdit}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('observacoes')}
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
                  mode === 'create' ? 'Criar Orçamento' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
