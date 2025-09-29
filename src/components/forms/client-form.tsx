"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema } from "@/lib/validation";
import { onlyDigits } from "@/lib/validators";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/types/models";

type ClientFormData = {
  name: string;
  cnpjCpf: string;
  phone: string;
  email: string;
  address: string;
  force?: boolean;
};

interface ClientFormProps {
  mode: 'create' | 'edit'
  initialData?: Client
}

function formatCpfCnpj(value: string): string {
  const d = onlyDigits(value);
  if (d.length <= 11) {
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    let out = p1;
    if (p2) out += "." + p2;
    if (p3) out += "." + p3;
    if (p4) out += "-" + p4;
    return out;
  }
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "/" + p4;
  if (p5) out += "-" + p5;
  return out;
}

function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const dd = d.slice(0, 2);
  const p1 = d.length > 10 ? d.slice(2, 7) : d.slice(2, 6);
  const p2 = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
  let out = dd ? `(${dd}` : "";
  if (dd && dd.length === 2) out += ") ";
  if (p1) out += p1;
  if (p2) out += "-" + p2;
  return out;
}

export function ClientForm({ mode, initialData }: ClientFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [duplicationError, setDuplicationError] = useState("");

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors, isValid, isSubmitting } 
  } = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: initialData ? {
      name: initialData.name,
      cnpjCpf: initialData.cnpjCpf,
      phone: initialData.phone,
      email: initialData.email,
      address: initialData.address,
    } : undefined,
  });

  const cnpjCpf = watch('cnpjCpf');

  // Check for duplicates (only on create or if cnpjCpf changed)
  useEffect(() => {
    if (mode === 'edit' && initialData?.cnpjCpf === cnpjCpf) {
      return; // Don't check if unchanged
    }

    const timer = setTimeout(async () => {
      if (cnpjCpf && (onlyDigits(cnpjCpf).length === 11 || onlyDigits(cnpjCpf).length === 14)) {
        try {
          const res = await fetch(`/api/clients/check-cnpj-cpf?value=${encodeURIComponent(cnpjCpf)}`);
          if (res.status === 409) {
            const err = await res.json();
            setDuplicationError(err?.error?.message || "CNPJ/CPF já existe.");
          } else {
            setDuplicationError("");
          }
        } catch {
          setDuplicationError("");
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cnpjCpf, mode, initialData?.cnpjCpf]);

  const onSubmit = async (data: ClientFormData) => {
    setServerError("");

    if (duplicationError && mode === 'create') {
      const proceed = window.confirm(`${duplicationError} Deseja cadastrar mesmo assim?`);
      if (!proceed) return;
      data.force = true;
    }

    try {
      const url = mode === 'create' 
        ? '/api/clients' 
        : `/api/clients/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} cliente.`);
      }

      toast.success(`Cliente ${mode === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
      router.push('/clients');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  return (
    <Card className="max-w-4xl w-full">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && <ErrorAlert message={serverError} className="mb-4" />}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name" 
                placeholder="Nome completo" 
                aria-invalid={!!errors.name} 
                {...register('name')} 
              />
              {errors.name?.message && (
                <p className="text-sm text-destructive">{String(errors.name.message)}</p>
              )}
            </FormField>

            <FormField>
              <Label htmlFor="cnpjCpf">CNPJ/CPF *</Label>
              {(() => {
                const reg = register('cnpjCpf');
                return (
                  <Input 
                    id="cnpjCpf" 
                    placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                    maxLength={18} 
                    aria-invalid={!!errors.cnpjCpf || !!duplicationError} 
                    {...reg}
                    onChange={(e) => {
                      e.target.value = formatCpfCnpj(e.target.value);
                      reg.onChange(e);
                      setValue('cnpjCpf', e.target.value, { shouldValidate: true });
                    }} 
                  />
                );
              })()}
              {errors.cnpjCpf?.message && (
                <p className="text-sm text-destructive">{String(errors.cnpjCpf.message)}</p>
              )}
              {duplicationError && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">{duplicationError}</p>
              )}
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="phone">Telefone *</Label>
              {(() => {
                const reg = register('phone');
                return (
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="(11) 98765-4321" 
                    maxLength={16} 
                    aria-invalid={!!errors.phone} 
                    {...reg}
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value);
                      reg.onChange(e);
                      setValue('phone', e.target.value, { shouldValidate: true });
                    }} 
                  />
                );
              })()}
              {errors.phone?.message && (
                <p className="text-sm text-destructive">{String(errors.phone.message)}</p>
              )}
            </FormField>

            <FormField>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                aria-invalid={!!errors.email} 
                {...register('email')} 
              />
              {errors.email?.message && (
                <p className="text-sm text-destructive">{String(errors.email.message)}</p>
              )}
            </FormField>
          </FormGrid>

          <FormField>
            <Label htmlFor="address">Endereço *</Label>
            <Input 
              id="address" 
              placeholder="Rua, número, bairro, cidade" 
              aria-invalid={!!errors.address} 
              {...register('address')} 
            />
            {errors.address?.message && (
              <p className="text-sm text-destructive">{String(errors.address.message)}</p>
            )}
          </FormField>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/clients')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar Cliente' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
