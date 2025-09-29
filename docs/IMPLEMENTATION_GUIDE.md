# Implementation Guide - Alphabook Web Revision

## Quick Start for Code Mode

This guide provides **exact code changes** needed to implement the comprehensive revision. Each section includes file paths, before/after code, and validation steps.

---

## 🚨 CRITICAL FIX #1: Sidebar Duplication (ISSUE-001)

### Priority: DO THIS FIRST
**Impact**: Fixes broken sidebar styling across the entire application

### File: [`src/app/dashboard/page.tsx`](alphabook_web/src/app/dashboard/page.tsx:1)

**BEFORE** (Lines 18-48):
```tsx
export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              {/* ... breadcrumb code ... */}
            </Breadcrumb>
          </div>
        </header>
        <Dashboard />
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**AFTER**:
```tsx
import { Dashboard } from "@/components/dashboard/Dashboard"

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex h-16 items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <Dashboard />
    </div>
  )
}
```

**Validation**:
1. Visit http://localhost:3000/dashboard
2. Verify sidebar appears correctly
3. Test sidebar collapse/expand (Ctrl+B)
4. Navigate to other pages, verify sidebar still works
5. Check browser console for errors

---

## 🔧 CRITICAL FIX #2: Create Type Definitions (ISSUE-002)

### File: `src/types/models.ts` (NEW FILE)

```typescript
/**
 * Core data models for Alphabook application
 */

export interface Client {
  id: number
  name: string
  cnpjCpf: string
  phone: string
  email: string
  address: string
}

export interface Center {
  id: number
  name: string
  type: string
  obs: string
}

export interface Order {
  id: number
  clientId: number
  centerId: number
  title: string
  tiragem: number
  formato: string
  numPaginasTotal: number
  numPaginasColoridas: number
  valorUnitario: number
  valorTotal: number
  prazoEntrega: string
  obs: string
  date: Date | string
  
  // Optional fields
  numero_pedido?: string | null
  data_pedido?: Date | string | null
  data_entrega?: Date | string | null
  solicitante?: string | null
  documento?: string | null
  editorial?: string | null
  tipo_produto?: string | null
  cor_miolo?: string | null
  papel_miolo?: string | null
  papel_capa?: string | null
  cor_capa?: string | null
  laminacao?: string | null
  acabamento?: string | null
  shrink?: string | null
  pagamento?: string | null
  frete?: string | null
  status?: string
  
  // Relations
  client?: Client
  center?: Center
}

export interface Budget {
  id: number
  numero_pedido?: string | null
  data_pedido: Date | string
  data_entrega?: Date | string | null
  solicitante?: string | null
  documento?: string | null
  editorial?: string | null
  tipo_produto?: string | null
  titulo: string
  tiragem: number
  formato: string
  total_pgs: number
  pgs_colors: number
  cor_miolo?: string | null
  papel_miolo?: string | null
  papel_capa?: string | null
  cor_capa?: string | null
  laminacao?: string | null
  acabamento?: string | null
  shrink?: string | null
  centro_producao?: string | null
  observacoes?: string | null
  preco_unitario: number
  preco_total: number
  prazo_producao?: string | null
  pagamento?: string | null
  frete?: string | null
  approved: boolean
  orderId?: number | null
  order?: Order | null
}

export interface DashboardSummary {
  totalClients: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

export interface RecentOrder extends Pick<Order, 'id' | 'title' | 'valorTotal' | 'status' | 'date' | 'numero_pedido'> {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone'>
  center: Pick<Center, 'id' | 'name'>
}

export interface RecentClient extends Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'cnpjCpf'> {}

export type OrderStatus = 
  | 'Pendente'
  | 'Em produção'
  | 'Finalizado'
  | 'Entregue'
  | 'Cancelado'
```

### File: `src/types/api.ts` (NEW FILE)

```typescript
/**
 * API response types and utilities
 */

export interface ApiErrorDetails {
  message: string
  details?: {
    formErrors?: string[]
    fieldErrors?: Record<string, string[]>
  }
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiErrorDetails | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}

export interface ApiError {
  error: ApiErrorDetails
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as any).error === 'object'
  )
}

/**
 * Extract error message from API response
 */
export function getApiErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const details = error.error.details
    const formErrors = details?.formErrors || []
    const fieldErrors = details?.fieldErrors || {}
    const fieldMessages = Object.values(fieldErrors).flat()
    const allErrors = [...formErrors, ...fieldMessages].filter(Boolean)
    
    if (allErrors.length > 0) {
      return `${error.error.message}: ${allErrors.join(', ')}`
    }
    
    return error.error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Erro desconhecido'
}
```

### Update: [`src/app/clients/page.tsx`](alphabook_web/src/app/clients/page.tsx:1)

**Add import at top:**
```tsx
import type { Client } from "@/types/models"
import type { PaginatedResponse } from "@/types/api"
```

**Change line 15:**
```tsx
// BEFORE
const [clients, setClients] = useState<ClientInput[]>([]);

// AFTER
const [clients, setClients] = useState<Client[]>([]);
```

**Validation**:
- TypeScript compiles without errors
- IDE autocomplete works for client properties
- No `any` types remain

---

## 🎨 FIX #3: Create Reusable Components

### File: `src/components/ui/status-badge.tsx` (NEW FILE)

```tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types/models"

interface StatusBadgeProps {
  status: OrderStatus | string
  className?: string
}

const statusStyles: Record<string, string> = {
  'Pendente': 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  'Em produção': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  'Finalizado': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Entregue': 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  'Cancelado': 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'Concluído': 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Em Andamento': 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20'
  
  return (
    <Badge variant="outline" className={cn(style, 'font-medium', className)}>
      {status}
    </Badge>
  )
}
```

### File: `src/components/ui/empty-state.tsx` (NEW FILE)

```tsx
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center",
      className
    )}>
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action}
    </div>
  )
}
```

### File: `src/components/ui/error-alert.tsx` (NEW FILE)

```tsx
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorAlert({ 
  title = "Erro", 
  message, 
  onRetry 
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            Tentar Novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
```

### File: `src/components/ui/page-header.tsx` (NEW FILE)

```tsx
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex h-16 items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
```

**Validation**:
- TypeScript compiles
- Components export correctly
- Can import in other files

---

## 🔄 FIX #4: Update Dashboard Component

### File: [`src/components/dashboard/Dashboard.tsx`](alphabook_web/src/components/dashboard/Dashboard.tsx:1)

**Update imports** (lines 1-9):
```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./RevenueChart";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { DashboardSummary, RecentOrder, RecentClient } from "@/types/models";
```

**Remove old interfaces** (lines 11-43) - Now imported from types

**Update error display** (around line 86-92):
```tsx
// BEFORE
if (error) {
  return (
    <div className="p-8">
      <div className="text-red-600">Erro ao carregar dados: {error}</div>
    </div>
  );
}

// AFTER
if (error) {
  return (
    <div className="p-8">
      <ErrorAlert 
        message={error} 
        onRetry={() => window.location.reload()} 
      />
    </div>
  );
}
```

**Update status badge** (around line 217):
```tsx
// BEFORE
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  order.status === 'Concluído' ? 'bg-green-100 text-green-800' :
  order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
  order.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {order.status}
</span>

// AFTER
<StatusBadge status={order.status} />
```

---

## 📝 FIX #5: Update Clients List Page

### File: [`src/app/clients/page.tsx`](alphabook_web/src/app/clients/page.tsx:1)

**Update imports** (lines 1-11):
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link"; // ADD THIS
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header"; // ADD THIS
import { EmptyState } from "@/components/ui/empty-state"; // ADD THIS
import { ErrorAlert } from "@/components/ui/error-alert"; // ADD THIS
import { Users } from "lucide-react"; // ADD THIS
import type { Client } from "@/types/models"; // ADD THIS
import type { PaginatedResponse } from "@/types/api"; // ADD THIS
```

**Update state types** (line 15):
```tsx
// BEFORE
const [clients, setClients] = useState<ClientInput[]>([]);

// AFTER
const [clients, setClients] = useState<Client[]>([]);
```

**Replace page header** (line 95):
```tsx
// BEFORE
<div className="flex h-16 items-center px-4"><h1 className="text-xl font-semibold">Cadastro de Clientes</h1></div>

// AFTER
<PageHeader 
  title="Clientes" 
  description="Gerencie seus clientes"
  actions={
    <Button asChild>
      <Link href="/clients/new">Novo Cliente</Link>
    </Button>
  }
/>
```

**Update toolbar** (line 98-104):
```tsx
// REMOVE the "Novo Cliente" button from toolbar (now in header)
<Toolbar>
  <ToolbarSection>
    <Input 
      placeholder="Pesquisar clientes..." 
      value={q} 
      onChange={(e) => { setPage(1); setQ(e.target.value); }} 
      className="w-64" 
    />
  </ToolbarSection>
  {/* rest of toolbar */}
</Toolbar>
```

**Update button on line 101**:
```tsx
// BEFORE
<Button asChild><a href={`/clients/${client.id}/edit`}>Editar</a></Button>

// AFTER
<Button asChild variant="outline" size="sm">
  <Link href={`/clients/${client.id}/edit`}>Editar</Link>
</Button>
```

**Update loading state** (line 139):
```tsx
// BEFORE
{loading && <div className="text-blue-600">Carregando...</div>}

// AFTER (remove completely - will use skeleton in table)
```

**Update error state** (line 140):
```tsx
// BEFORE
{error && <div className="text-red-600">{error}</div>}

// AFTER
{error && <ErrorAlert message={error} onRetry={fetchClients} />}
```

**Add empty state** (after line 152, before table body):
```tsx
<TableBody>
  {loading ? (
    // Skeleton rows
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      </TableRow>
    ))
  ) : clients.length === 0 ? (
    // Empty state
    <TableRow>
      <TableCell colSpan={6} className="h-64">
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Comece criando seu primeiro cliente para gerenciar suas ordens de produção"
          action={
            <Button asChild>
              <Link href="/clients/new">Criar Primeiro Cliente</Link>
            </Button>
          }
        />
      </TableCell>
    </TableRow>
  ) : (
    // Actual data
    clients.map((client) => (
      {/* existing table row code */}
    ))
  )}
</TableBody>
```

**Add success toast** (after line 85, in handleDelete):
```tsx
import { toast } from "sonner" // Add to imports

// In handleDelete, after successful delete:
await fetchClients();
toast.success("Cliente excluído com sucesso!");
```

---

## 🎯 FIX #6: Shared Client Form

### File: `src/components/forms/client-form.tsx` (NEW FILE)

```tsx
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
```

---

## 🔄 FIX #7: Update Client New Page to Use Shared Form

### File: [`src/app/clients/new/page.tsx`](alphabook_web/src/app/clients/new/page.tsx:1)

**REPLACE ENTIRE FILE**:
```tsx
import { ClientForm } from "@/components/forms/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <ClientForm mode="create" />
    </div>
  );
}
```

### File: `src/app/clients/[id]/edit/page.tsx`

**REPLACE ENTIRE FILE**:
```tsx
import { ClientForm } from "@/components/forms/client-form";
import { notFound } from "next/navigation";
import type { Client } from "@/types/models";

async function getClient(id: string): Promise<Client | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clients/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function EditClientPage({
  params,
}: {
  params: { id: string }
}) {
  const client = await getClient(params.id);
  
  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClientForm mode="edit" initialData={client} />
    </div>
  );
}
```

**Result**: 
- Reduced from ~200 lines each to ~15 lines each
- All logic centralized in shared form
- Easier to maintain

---

## 🎨 FIX #8: Add Missing Alert Component

Since we're using `ErrorAlert` but haven't added the Alert component from shadcn/ui:

### Run Command:
```bash
cd alphabook_web
npx shadcn@latest add alert
```

This will create [`src/components/ui/alert.tsx`](alphabook_web/src/components/ui/alert.tsx:1)

**Validation**: Component added successfully

---

## 📋 FIX #9: Standardize All List Pages

Apply the same patterns from clients page to:

### Files to Update (Same Pattern):
1. [`src/app/orders/page.tsx`](alphabook_web/src/app/orders/page.tsx:1)
2. [`src/app/budgets/page.tsx`](alphabook_web/src/app/budgets/page.tsx:1)
3. [`src/app/centers/page.tsx`](alphabook_web/src/app/centers/page.tsx:1)

### Pattern to Apply:
```tsx
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorAlert } from "@/components/ui/error-alert"
import { StatusBadge } from "@/components/ui/status-badge" // If shows status
import Link from "next/link"

// Replace header
<PageHeader title="..." description="..." actions={<Button asChild><Link href="...">New</Link></Button>} />

// Add empty state
{data.length === 0 && !loading && (
  <EmptyState icon={Icon} title="..." description="..." action={...} />
)}

// Replace error display
{error && <ErrorAlert message={error} onRetry={refetch} />}

// Add loading skeletons
{loading && Array.from({length: 5}).map(...)}

// Use StatusBadge for status display
<StatusBadge status={item.status} />

// Replace <a> with Link
<Button asChild><Link href="...">Text</Link></Button>
```

---

## 🎯 Implementation Order

### Day 1: Critical Fixes (4-6 hours)
1. ✅ Create type files (`types/models.ts`, `types/api.ts`)
2. ✅ Fix dashboard sidebar duplication (ISSUE-001)
3. ✅ Create reusable components (StatusBadge, EmptyState, ErrorAlert, PageHeader)
4. ✅ Add Alert component from shadcn

**Validation**: 
- No TypeScript errors
- Sidebar works on all routes
- New components render correctly

### Day 2: Clients Module (4-6 hours)
1. ✅ Update clients list page with new patterns
2. ✅ Create shared ClientForm component
3. ✅ Update clients/new page
4. ✅ Update clients/[id]/edit page
5. ✅ Add toasts for success/error

**Validation**:
- All CRUD operations work
- Loading states show correctly
- Empty state appears when no data
- Errors display in Alert component
- Toasts appear on success

### Day 3: Orders Module (4-6 hours)
1. Apply same pattern to orders list
2. Create shared OrderForm component
3. Update orders/new and orders/[id]/edit
4. Test thoroughly

### Day 4: Budgets & Centers (4-6 hours)
1. Apply pattern to budgets
2. Apply pattern to centers
3. Update dashboard to use new types
4. Full testing pass

### Day 5: Polish & Documentation (4-6 hours)
1. Fix any remaining `<a>` → `Link` conversions
2. Standardize all loading states
3. Add missing breadcrumbs
4. Update documentation
5. Final testing
6. Create PR

---

## Validation Checklist

After implementing each fix, verify:

### Per-Fix Validation
- [ ] TypeScript compiles without errors
- [ ] ESLint shows no errors
- [ ] Page renders correctly
- [ ] Functionality works as before
- [ ] No console errors
- [ ] No visual regressions

### End-of-Day Validation
- [ ] All routes still work
- [ ] Sidebar functions properly
- [ ] Forms submit correctly
- [ ] No broken links
- [ ] Mobile view acceptable
- [ ] Dark mode works

### End-of-Sprint Validation
- [ ] All CRUD operations complete successfully
- [ ] Lighthouse score > 85
- [ ] No accessibility errors (axe DevTools)
- [ ] Cross-browser testing passed
- [ ] Mobile testing passed
- [ ] Stakeholder approval obtained

---

## Common Pitfalls & Solutions

### Pitfall 1: Import Paths Break
**Problem**: Moving components breaks imports
**Solution**: Use global find/replace, verify with TypeScript

### Pitfall 2: CSS Variables Not Available
**Problem**: New components don't have theme colors
**Solution**: Always use CSS variable classes from [`tailwind.config.ts`](alphabook_web/tailwind.config.ts:1)

### Pitfall 3: Server/Client Component Confusion
**Problem**: "useState can't be used in Server Component"
**Solution**: Add `"use client"` directive at top of file

### Pitfall 4: Lost Form State on Error
**Problem**: Form resets after validation error
**Solution**: Don't clear form, only show error message

### Pitfall 5: TypeScript Errors After Changes
**Problem**: Changing types breaks existing code
**Solution**: Fix incrementally, use `// @ts-expect-error` temporarily if needed

---

## Code Snippets Library

### API Error Handling
```tsx
try {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Request failed');
  }
  const data = await res.json();
  toast.success('Success!');
  return data;
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Unknown error');
  throw error;
}
```

### Form Submission
```tsx
const onSubmit = async (data: FormData) => {
  try {
    await apiRequest(url, { method, body: JSON.stringify(data) });
    toast.success('Saved!');
    router.push('/list');
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error');
  }
};
```

### Loading Skeleton
```tsx
{loading ? (
  <Skeleton className="h-8 w-full" />
) : (
  <ActualContent />
)}
```

### Empty State
```tsx
{items.length === 0 && !loading && (
  <EmptyState
    icon={Icon}
    title="No items"
    description="Get started by creating your first item"
    action={<Button asChild><Link href="/new">Create</Link></Button>}
  />
)}
```

---

## Testing Commands

### Type Check
```bash
cd alphabook_web
npx tsc --noEmit
```

### Lint
```bash
pnpm lint
```

### Run Tests
```bash
pnpm test
pnpm e2e
```

### Build
```bash
pnpm build
```

### Check Bundle Size
```bash
pnpm build
# Check .next/static/chunks for size
```

---

## Git Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b refactor/comprehensive-revision

# Work in smaller feature branches
git checkout -b fix/sidebar-duplication
# ... make changes ...
git commit -m "fix: remove duplicate SidebarProvider from dashboard"
git checkout refactor/comprehensive-revision
git merge fix/sidebar-duplication
```

### Commit Message Format
```
type(scope): subject

body (optional)

BREAKING CHANGE: description (if applicable)
```

**Types**: `fix`, `feat`, `refactor`, `docs`, `style`, `test`, `chore`

**Examples**:
- `fix(sidebar): remove duplicate SidebarProvider from dashboard`
- `refactor(forms): extract shared ClientForm component`
- `feat(ui): add EmptyState and ErrorAlert components`
- `docs: update implementation guide with validation steps`

---

## Success Criteria

### Code Quality ✅
- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors  
- [ ] 0 `any` types (except where absolutely necessary)
- [ ] All components use `cn()` utility
- [ ] All components properly typed

### Performance ✅
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] No layout shifts (CLS = 0)
- [ ] Bundle size acceptable

### User Experience ✅
- [ ] Sidebar works on all routes
- [ ] Loading states everywhere
- [ ] Empty states for all lists
- [ ] Error messages user-friendly
- [ ] Success feedback (toasts)
- [ ] Consistent button styles
- [ ] Mobile responsive

### Accessibility ✅
- [ ] Keyboard navigation complete
- [ ] Screen reader friendly
- [ ] ARIA labels correct
- [ ] Focus management works
- [ ] Color contrast WCAG AA

### Maintainability ✅
- [ ] No code duplication
- [ ] Clear component boundaries
- [ ] Consistent patterns
- [ ] Well documented

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-29  
**For**: Code Mode Implementation  
**Estimated Total Effort**: 40-50 hours