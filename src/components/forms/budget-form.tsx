"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BudgetSchema, BudgetInput } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Budget } from "@/types/models";

interface BudgetFormProps {
  mode: 'create' | 'edit';
  initialData?: Budget;
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

const mapBudgetDefaults = (budget: Budget): Partial<BudgetInput> => ({
  numero_pedido: budget.numero_pedido ?? undefined,
  data_pedido: toDateInputValue(budget.data_pedido),
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
  approved: budget.approved ?? undefined,
  orderId: budget.orderId ?? undefined,
});

export function BudgetForm({ mode, initialData }: BudgetFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const formDefaultValues = useMemo<Partial<BudgetInput> | undefined>(() => {
    if (!initialData) return undefined;
    return mapBudgetDefaults(initialData);
  }, [initialData]);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid, isSubmitting } 
  } = useForm<BudgetInput>({
    resolver: zodResolver(BudgetSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  const onSubmit = async (data: BudgetInput) => {
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

  return (
    <Card className="max-w-4xl w-full">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Novo Orçamento' : 'Editar Orçamento'}</CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && <ErrorAlert message={serverError} className="mb-4" />}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" placeholder="Título do orçamento" {...register('titulo')} />
            {errors.titulo?.message && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
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
              <Label htmlFor="prazo_producao">Prazo de Produção</Label>
              <Input id="prazo_producao" type="date" {...register('prazo_producao')} />
              {errors.prazo_producao?.message && <p className="text-sm text-destructive">{errors.prazo_producao.message}</p>}
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="total_pgs">Páginas Totais *</Label>
              <Input id="total_pgs" type="number" placeholder="0" {...register('total_pgs', { valueAsNumber: true })} />
              {errors.total_pgs?.message && <p className="text-sm text-destructive">{errors.total_pgs.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="pgs_colors">Páginas Coloridas *</Label>
              <Input id="pgs_colors" type="number" placeholder="0" {...register('pgs_colors', { valueAsNumber: true })} />
              {errors.pgs_colors?.message && <p className="text-sm text-destructive">{errors.pgs_colors.message}</p>}
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="preco_unitario">Valor Unitário *</Label>
              <Input id="preco_unitario" type="number" step="0.01" placeholder="0.00" {...register('preco_unitario', { valueAsNumber: true })} />
              {errors.preco_unitario?.message && <p className="text-sm text-destructive">{errors.preco_unitario.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="preco_total">Valor Total *</Label>
              <Input id="preco_total" type="number" step="0.01" placeholder="0.00" {...register('preco_total', { valueAsNumber: true })} />
              {errors.preco_total?.message && <p className="text-sm text-destructive">{errors.preco_total.message}</p>}
            </FormField>
          </FormGrid>

          <FormField>
            <Label htmlFor="observacoes">Observações</Label>
            <Input id="observacoes" placeholder="Observações sobre o orçamento" {...register('observacoes')} />
            {errors.observacoes?.message && <p className="text-sm text-destructive">{errors.observacoes.message}</p>}
          </FormField>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/budgets')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar Orçamento' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
