// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\budgets\\new\\page.tsx
"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BudgetSchema } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
};

function Navbar() {
  return (
    <nav className="w-full bg-white shadow flex justify-center py-4 mb-8">
      <div className="flex gap-8">
        <Button asChild variant="ghost"><a href="/">Dashboard</a></Button>
        <Button asChild variant="ghost"><a href="/clients">Clientes</a></Button>
        <Button asChild variant="ghost"><a href="/centers">Centros</a></Button>
        <Button asChild variant="ghost"><a href="/orders">Ordens</a></Button>
        <Button asChild variant="ghost"><a href="/budgets">Orçamentos</a></Button>
        <Button asChild variant="ghost"><a href="/reports">Relatórios</a></Button>
      </div>
    </nav>
  );
}

export default function NewBudgetForm({ specifications }: { specifications: any }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors, isValid, isSubmitting } } = useForm<BudgetFormData>({
    resolver: zodResolver(BudgetSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

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
      const res = await fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao criar orçamento.';
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join('; ')}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao criar orçamento.');
        }
      }
      router.push('/budgets');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar orçamento.');
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      <Navbar />
      <Card className="max-w-3xl w-full mt-8">
        <CardHeader>
          <CardTitle>Novo Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && <div className="text-red-600 mb-2">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" aria-invalid={!!errors.titulo} {...register('titulo')} />
            {errors.titulo?.message && <p className="text-sm text-red-600">{String(errors.titulo.message)}</p>}

            <Label htmlFor="tiragem">Tiragem</Label>
            <Input id="tiragem" type="number" min={0} aria-invalid={!!errors.tiragem} {...register('tiragem', { valueAsNumber: true })} />
            {errors.tiragem?.message && <p className="text-sm text-red-600">{String(errors.tiragem.message)}</p>}

            <Label htmlFor="formato">Formato</Label>
            <select id="formato" {...register('formato')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Formato Fechado"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {errors.formato?.message && <p className="text-sm text-red-600">{String(errors.formato.message)}</p>}

            <Label htmlFor="total_pgs">Nº de páginas total</Label>
            <Input id="total_pgs" type="number" min={0} aria-invalid={!!errors.total_pgs} {...register('total_pgs', { valueAsNumber: true })} />
            {errors.total_pgs?.message && <p className="text-sm text-red-600">{String(errors.total_pgs.message)}</p>}

            <Label htmlFor="pgs_colors">Nº de páginas coloridas</Label>
            <Input id="pgs_colors" type="number" min={0} aria-invalid={!!errors.pgs_colors} {...register('pgs_colors', { valueAsNumber: true })} />
            {errors.pgs_colors?.message && <p className="text-sm text-red-600">{String(errors.pgs_colors.message)}</p>}

            <Label htmlFor="preco_unitario">Valor Unitário</Label>
            <Controller
              name="preco_unitario"
              control={control}
              render={({ field }) => (
                <Input
                  id="preco_unitario"
                  type="text"
                  inputMode="decimal"
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

            <Label htmlFor="preco_total">Valor Total</Label>
            <Controller
              name="preco_total"
              control={control}
              render={({ field }) => (
                <Input
                  id="preco_total"
                  type="text"
                  readOnly
                  aria-invalid={!!errors.preco_total}
                  value={formatCurrencyBRL(Number(field.value) || 0)}
                />
              )}
            />
            {errors.preco_total?.message && <p className="text-sm text-red-600">{String(errors.preco_total.message)}</p>}

            <Label htmlFor="prazo_producao">Prazo de produção</Label>
            <Input id="prazo_producao" type="date" aria-invalid={!!errors.prazo_producao} {...register('prazo_producao')} />
            {errors.prazo_producao?.message && <p className="text-sm text-red-600">{String(errors.prazo_producao.message)}</p>}

            <Label htmlFor="observacoes">Observações</Label>
            <Input id="observacoes" {...register('observacoes')} />

            <Label htmlFor="numero_pedido">Número do Pedido</Label>
            <Input id="numero_pedido" {...register('numero_pedido')} />

            <Label htmlFor="data_pedido">Data do Pedido</Label>
            <Input id="data_pedido" type="date" {...register('data_pedido')} />

            <Label htmlFor="data_entrega">Data de Entrega</Label>
            <Input id="data_entrega" type="date" {...register('data_entrega')} />

            <Label htmlFor="solicitante">Solicitante</Label>
            <Input id="solicitante" {...register('solicitante')} />

            <Label htmlFor="documento">Documento</Label>
            <Input id="documento" {...register('documento')} />

            <Label htmlFor="editorial">Editorial</Label>
            <Input id="editorial" {...register('editorial')} />

            <Label htmlFor="tipo_produto">Tipo de Produto</Label>
            <select id="tipo_produto" {...register('tipo_produto')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Tipo de produto"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="cor_miolo">Cor do Miolo</Label>
            <select id="cor_miolo" {...register('cor_miolo')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Cor do miolo"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="papel_miolo">Papel do Miolo</Label>
            <select id="papel_miolo" {...register('papel_miolo')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Tipo de Papel miolo"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="papel_capa">Papel da Capa</Label>
            <select id="papel_capa" {...register('papel_capa')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Tipo de Papel de Capa"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="cor_capa">Cor da Capa</Label>
            <select id="cor_capa" {...register('cor_capa')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Cor da capa"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="laminacao">Laminação</Label>
            <select id="laminacao" {...register('laminacao')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Tipo de laminação"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="acabamento">Acabamento</Label>
            <select id="acabamento" {...register('acabamento')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Tipo de acabamento"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="shrink">Shrink</Label>
            <select id="shrink" {...register('shrink')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Shrink"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="centro_producao">Centro de Produção</Label>
            <select id="centro_producao" {...register('centro_producao')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Centro de Produção"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="pagamento">Pagamento</Label>
            <select id="pagamento" {...register('pagamento')} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {specifications["Forma de pagamento"].map((item: string) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Label htmlFor="frete">Frete</Label>
            <Input id="frete" {...register('frete')} />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/budgets')}>Cancelar</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
