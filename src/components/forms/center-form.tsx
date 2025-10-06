"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CenterSchema, CenterInput } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-grid";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Center } from "@/types/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CenterFormProps {
  mode: 'create' | 'edit';
  initialData?: Center;
}

type CenterFormValues = z.input<typeof CenterSchema>;


const CENTER_TYPES = ["Interno", "Terceirizado", "Digital", "Offset", "Outro"] as const;

const isCenterType = (value: string): value is CenterFormValues['type'] => {
  return (CENTER_TYPES as readonly string[]).includes(value);
};

const mapCenterDefaults = (center: Center): CenterFormValues => ({
  name: center.name,
  type: isCenterType(center.type) ? center.type : "Outro",
  obs: center.obs ?? "",
});

export function CenterForm({ mode, initialData }: CenterFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const formDefaultValues = useMemo(() => {
    if (!initialData) return undefined;
    return mapCenterDefaults(initialData);
  }, [initialData]);

  const { 
    register, 
    handleSubmit, 
    setValue,
    formState: { errors, isValid, isSubmitting } 
  } = useForm<CenterFormValues, undefined, CenterInput>({
    resolver: zodResolver(CenterSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  const onSubmit = async (data: CenterInput) => {
    setServerError("");
    try {
      const url = mode === 'create' 
        ? '/api/centers' 
        : `/api/centers/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} centro.`);
      }

      toast.success(`Centro ${mode === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
      router.push('/centers');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  return (
    <Card className="max-w-4xl w-full">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Novo Centro de Produção' : 'Editar Centro de Produção'}</CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && <ErrorAlert message={serverError} className="mb-4" />}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" placeholder="Nome do centro" {...register('name')} />
            {errors.name?.message && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </FormField>

          <FormField>
            <Label htmlFor="type">Tipo *</Label>
            <Select
              onValueChange={(value) => {
                const nextType = isCenterType(value) ? value : "Outro";
                setValue('type', nextType);
              }}
              defaultValue={formDefaultValues?.type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Interno">Interno</SelectItem>
                <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
                <SelectItem value="Offset">Offset</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.type?.message && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </FormField>

          <FormField>
            <Label htmlFor="obs">Observações *</Label>
            <Input id="obs" placeholder="Observações sobre o centro" {...register('obs')} />
            {errors.obs?.message && <p className="text-sm text-destructive">{errors.obs.message}</p>}
          </FormField>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/centers')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar Centro' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
