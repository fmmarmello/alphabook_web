// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\budgets\[id]\\edit\\page.tsx
"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BudgetSchema } from "@/lib/validation";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { formatCurrencyBRL, parseCurrencyBRL } from "@/lib/utils";

type BudgetFormData = {
  titulo: string;
  tiragem: number;
  formato: string;
  total_pgs: number;
  pgs_colors: number;
  preco_unitario: number;
  preco_total: number;
  prazo_producao: string;
  observacoes: string;
  numero_pedido: string;
  data_pedido: string;
  data_entrega: string;
  solicitante: string;
  documento: string;
  editorial: string;
  tipo_produto: string;
  cor_miolo: string;
  papel_miolo: string;
  papel_capa: string;
  cor_capa: string;
  laminacao: string;
  acabamento: string;
  shrink: string;
  centro_producao: string;
  pagamento: string;
  frete: string;
  approved?: boolean;
};



export default function EditBudgetForm({ specifications }: { specifications: any }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors, isValid, isSubmitting } } = useForm<BudgetFormData>({
    resolver: zodResolver(BudgetSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/budgets/${id}`);
        const json = await res.json();
        const budget = json?.data ?? json;
        reset({
          ...budget,
        });
      } catch {} // TODO: handle error
    };
    if (id) load();
  }, [id, reset]);

  // Auto compute total
  const tiragem = watch("tiragem") || 0;
  const preco_unitario = watch("preco_unitario") || 0;
  useEffect(() => {
    const total = (Number(tiragem) || 0) * (Number(preco_unitario) || 0);
    setValue("preco_total", total, { shouldValidate: true });
  }, [tiragem, preco_unitario, setValue]);

  const onSubmit = async (data: BudgetFormData) => {
    setServerError("");
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao atualizar orçamento.';
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join('; ')}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao atualizar orçamento.');
        }
      }
      router.push('/budgets');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao atualizar orçamento.');
    }
  const handleApprove = async () => {
    setServerError("");
    try {
      const res = await fetch(`/api/budgets/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao aprovar orçamento.';
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join('; ')}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao aprovar orçamento.');
        }
      }
      router.push('/orders');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao aprovar orçamento.');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <Card className="max-w-3xl w-full mt-8">
        <CardHeader>
          <CardTitle>Editar Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && <div className="text-red-600 mb-4">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Project Identification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Identificação do Projeto</h3>
              <FormField>
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" placeholder="Nome do projeto/orçamento" aria-invalid={!!errors.titulo} {...register('titulo')} />
                {errors.titulo?.message && <p className="text-sm text-red-600">{String(errors.titulo.message)}</p>}
              </FormField>

              <FormGrid columns={3} gap="md">
                <FormField>
                  <Label htmlFor="numero_pedido">Número do Pedido</Label>
                  <Input id="numero_pedido" placeholder="Ex: 001/2024" {...register('numero_pedido')} />
                </FormField>

                <FormField>
                  <Label htmlFor="solicitante">Solicitante *</Label>
                  <Input id="solicitante" placeholder="Nome de quem solicitou" aria-invalid={!!errors.solicitante} {...register('solicitante')} />
                  {errors.solicitante?.message && <p className="text-sm text-red-600">{String(errors.solicitante.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="documento">Documento</Label>
                  <Input id="documento" placeholder="CPF/CNPJ do solicitante" {...register('documento')} />
                </FormField>
              </FormGrid>
            </div>

            {/* Section 2: Basic Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Especificações Básicas</h3>
              <FormGrid columns={4} gap="md">
                <FormField>
                  <Label htmlFor="tiragem">Tiragem *</Label>
                  <Input id="tiragem" type="number" min={1} placeholder="1000" aria-invalid={!!errors.tiragem} {...register('tiragem', { valueAsNumber: true })} />
                  {errors.tiragem?.message && <p className="text-sm text-red-600">{String(errors.tiragem.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="formato">Formato *</Label>
                  <Select onValueChange={(value) => setValue('formato', value)} {...register('formato')}>
                    <SelectTrigger aria-invalid={!!errors.formato}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Formato Fechado"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.formato?.message && <p className="text-sm text-red-600">{String(errors.formato.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="total_pgs">Nº de Páginas Total *</Label>
                  <Input id="total_pgs" type="number" min={1} placeholder="100" aria-invalid={!!errors.total_pgs} {...register('total_pgs', { valueAsNumber: true })} />
                  {errors.total_pgs?.message && <p className="text-sm text-red-600">{String(errors.total_pgs.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="pgs_colors">Nº de Páginas Coloridas</Label>
                  <Input id="pgs_colors" type="number" min={0} placeholder="20" aria-invalid={!!errors.pgs_colors} {...register('pgs_colors', { valueAsNumber: true })} />
                  {errors.pgs_colors?.message && <p className="text-sm text-red-600">{String(errors.pgs_colors.message)}</p>}
                </FormField>
              </FormGrid>

              <FormGrid columns={2} gap="md">
                <FormField>
                  <Label htmlFor="tipo_produto">Tipo de Produto *</Label>
                  <Select onValueChange={(value) => setValue('tipo_produto', value)} {...register('tipo_produto')}>
                    <SelectTrigger aria-invalid={!!errors.tipo_produto}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Tipo de produto"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipo_produto?.message && <p className="text-sm text-red-600">{String(errors.tipo_produto.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="editorial">Editorial</Label>
                  <Input id="editorial" placeholder="Grupo editorial" {...register('editorial')} />
                </FormField>
              </FormGrid>
            </div>

            {/* Section 3: Material Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Especificações de Material</h3>
              <FormGrid columns={4} gap="md">
                <FormField>
                  <Label htmlFor="cor_miolo">Cor do Miolo *</Label>
                  <Select onValueChange={(value) => setValue('cor_miolo', value)} {...register('cor_miolo')}>
                    <SelectTrigger aria-invalid={!!errors.cor_miolo}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Cor do miolo"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cor_miolo?.message && <p className="text-sm text-red-600">{String(errors.cor_miolo.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="papel_miolo">Papel do Miolo *</Label>
                  <Select onValueChange={(value) => setValue('papel_miolo', value)} {...register('papel_miolo')}>
                    <SelectTrigger aria-invalid={!!errors.papel_miolo}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Tipo de Papel miolo"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.papel_miolo?.message && <p className="text-sm text-red-600">{String(errors.papel_miolo.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="cor_capa">Cor da Capa *</Label>
                  <Select onValueChange={(value) => setValue('cor_capa', value)} {...register('cor_capa')}>
                    <SelectTrigger aria-invalid={!!errors.cor_capa}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Cor da capa"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cor_capa?.message && <p className="text-sm text-red-600">{String(errors.cor_capa.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="papel_capa">Papel da Capa *</Label>
                  <Select onValueChange={(value) => setValue('papel_capa', value)} {...register('papel_capa')}>
                    <SelectTrigger aria-invalid={!!errors.papel_capa}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Tipo de Papel de Capa"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.papel_capa?.message && <p className="text-sm text-red-600">{String(errors.papel_capa.message)}</p>}
                </FormField>
              </FormGrid>
            </div>

            {/* Section 4: Finishing Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Acabamentos</h3>
              <FormGrid columns={3} gap="md">
                <FormField>
                  <Label htmlFor="laminacao">Laminação</Label>
                  <Select onValueChange={(value) => setValue('laminacao', value)} {...register('laminacao')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Tipo de laminação"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField>
                  <Label htmlFor="acabamento">Acabamento</Label>
                  <Select onValueChange={(value) => setValue('acabamento', value)} {...register('acabamento')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Tipo de acabamento"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField>
                  <Label htmlFor="shrink">Shrink</Label>
                  <Select onValueChange={(value) => setValue('shrink', value)} {...register('shrink')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Shrink"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </FormGrid>
            </div>

            {/* Section 5: Production Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Produção</h3>
              <FormGrid columns={3} gap="md">
                <FormField>
                  <Label htmlFor="centro_producao">Centro de Produção *</Label>
                  <Select onValueChange={(value) => setValue('centro_producao', value)} {...register('centro_producao')}>
                    <SelectTrigger aria-invalid={!!errors.centro_producao}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Centro de Produção"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.centro_producao?.message && <p className="text-sm text-red-600">{String(errors.centro_producao.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="prazo_producao">Prazo de Produção *</Label>
                  <Input id="prazo_producao" type="date" aria-invalid={!!errors.prazo_producao} {...register('prazo_producao')} />
                  {errors.prazo_producao?.message && <p className="text-sm text-red-600">{String(errors.prazo_producao.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="frete">Frete</Label>
                  <Input id="frete" placeholder="Tipo de frete" {...register('frete')} />
                </FormField>
              </FormGrid>
            </div>

            {/* Section 6: Business Terms */}
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
                        aria-invalid={!!errors.preco_unitario}
                        value={formatCurrencyBRL(Number(field.value) || 0)}
                        onChange={(e) => {
                          const num = parseCurrencyBRL(e.target.value);
                          field.onChange(num);
                        }}
                      />
                    )}
                  />
                  {errors.preco_unitario?.message && <p className="text-sm text-red-600">{String(errors.preco_unitario.message)}</p>}
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
                  {errors.preco_total?.message && <p className="text-sm text-red-600">{String(errors.preco_total.message)}</p>}
                </FormField>

                <FormField>
                  <Label htmlFor="pagamento">Forma de Pagamento *</Label>
                  <Select onValueChange={(value) => setValue('pagamento', value)} {...register('pagamento')}>
                    <SelectTrigger aria-invalid={!!errors.pagamento}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {specifications["Forma de pagamento"].map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pagamento?.message && <p className="text-sm text-red-600">{String(errors.pagamento.message)}</p>}
                </FormField>
              </FormGrid>
            </div>

            {/* Section 7: Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Prazos</h3>
              <FormGrid columns={2} gap="md">
                <FormField>
                  <Label htmlFor="data_pedido">Data do Pedido</Label>
                  <Input id="data_pedido" type="date" {...register('data_pedido')} />
                </FormField>

                <FormField>
                  <Label htmlFor="data_entrega">Data de Entrega</Label>
                  <Input id="data_entrega" type="date" {...register('data_entrega')} />
                </FormField>
              </FormGrid>
            </div>

            {/* Section 8: Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informações Adicionais</h3>
              <FormField>
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  rows={3}
                  placeholder="Observações gerais sobre o orçamento..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('observacoes')}
                />
              </FormField>
            </div>

            {/* Admin Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900">Administração</h3>
              <div className="flex items-center space-x-2">
                <Controller
                  name="approved"
                  control={control}
                  render={({ field }) => (
                    <input type="checkbox" id="approved" {...field} checked={field.value} disabled className="h-4 w-4" />
                  )}
                />
                <Label htmlFor="approved">Aprovado</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.push('/budgets')}>Cancelar</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>Salvar</Button>
              <Button type="button" variant="default" onClick={handleApprove} disabled={isSubmitting}>Aprovar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
