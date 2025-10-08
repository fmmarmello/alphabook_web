// src/app/orders/page.tsx - UPDATE IMPORTS AND TYPE

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrencyBRL } from "@/lib/utils";
import { Package, Plus, ExternalLink, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import { ColumnVisibilityDropdown, useTableWithColumnVisibility } from "@/components/ui/column-visibility";
import type { PaginatedResponse } from "@/types/api";

// ✅ Import Prisma generated types instead of recreating
import type { Order, Budget, Client, Center } from "@/generated/prisma";

// ✅ Use Prisma type with includes
type OrderWithBudget = Order & {
  budget: Budget & {
    client: Client;
    center: Center;
  };
};

const statusLabels = {
  'PENDING': 'Pendente',
  'IN_PRODUCTION': 'Em Produção',
  'COMPLETED': 'Concluída',
  'DELIVERED': 'Entregue',
  'CANCELLED': 'Cancelada',
  'ON_HOLD': 'Em Espera'
};

function OrdersContent() {
  const [orders, setOrders] = useState<OrderWithBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  // ✅ Updated TanStack Table columns using Prisma types
  const columns: ColumnDef<OrderWithBudget>[] = [
    {
      id: "numero_pedido",
      header: "Nº Ordem",
      meta: { label: "Nº Ordem", className: "w-[120px]" },
      cell: ({ row }) => (
        <Link
          href={`/orders/${row.original.id}/edit`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.original.numero_pedido}
        </Link>
      ),
    },
    {
      id: "budget_titulo",
      header: "Produto",
      meta: { label: "Produto", className: "w-[200px]" },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.budget.titulo}</div>
          <Link
            href={`/budgets/${row.original.budgetId}`}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver orçamento origem
          </Link>
        </div>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      meta: { label: "Cliente" },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.budget.client.name}</div>
          <div className="text-xs text-gray-500">{row.original.budget.client.cnpjCpf}</div>
        </div>
      ),
    },
    {
      id: "center",
      header: "Centro",
      meta: { label: "Centro" },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.budget.center.name}</div>
          <div className="text-xs text-gray-500">{row.original.budget.center.type}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          label={statusLabels[row.original.status]}
        />
      ),
    },
    {
      id: "tiragem",
      header: "Tiragem",
      meta: { label: "Tiragem" },
      cell: ({ row }) => row.original.budget.tiragem.toLocaleString(),
    },
    {
      id: "formato",
      header: "Formato",
      meta: { label: "Formato" },
      cell: ({ row }) => row.original.budget.formato,
    },
    {
      id: "valor_total",
      header: "Valor Total",
      meta: { label: "Valor Total" },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{formatCurrencyBRL(row.original.budget.preco_total)}</div>
          {row.original.frete_real && (
            <div className="text-xs text-gray-500">
              Frete: {formatCurrencyBRL(row.original.frete_real)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "responsavel_producao",
      header: "Responsável",
      meta: { label: "Responsável" },
      cell: ({ row }) => row.original.responsavel_producao || "-",
    },
    {
      id: "cronograma",
      header: "Cronograma",
      meta: { label: "Cronograma", className: "w-[140px]" },
      cell: ({ row }) => (
        <div className="text-xs space-y-1">
          {row.original.data_inicio_producao && (
            <div>Início: {new Date(row.original.data_inicio_producao).toLocaleDateString('pt-BR')}</div>
          )}
          {row.original.data_fim_producao && (
            <div>Fim: {new Date(row.original.data_fim_producao).toLocaleDateString('pt-BR')}</div>
          )}
          {row.original.data_entrega_real && (
            <div>Entregue: {new Date(row.original.data_entrega_real).toLocaleDateString('pt-BR')}</div>
          )}
          {row.original.budget.data_entrega && (
            <div className="text-gray-500">Prev: {new Date(row.original.budget.data_entrega).toLocaleDateString('pt-BR')}</div>
          )}
        </div>
      ),
    },
    {
      id: "data_pedido",
      header: "Criada em",
      meta: { label: "Criada em" },
      cell: ({ row }) => new Date(row.original.data_pedido).toLocaleDateString('pt-BR'),
    },
    {
      id: "actions",
      header: "Ações",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/orders/${order.id}/edit`}>
                <Edit className="w-4 h-4" />
              </Link>
            </Button>
            <ConfirmDialog
              title="Excluir ordem"
              description="Esta ação não pode ser desfeita."
              confirmLabel="Excluir"
              confirmVariant="destructive"
              onConfirm={() => handleDelete(order.id)}
              trigger={
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              }
            />
          </div>
        );
      },
    },
  ];

  const { table } = useTableWithColumnVisibility({
    data: orders,
    columns,
    storageKey: "orders.table.columnVisibility",
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "all") params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar ordens.");

      const json: PaginatedResponse<OrderWithBudget> = await res.json();
      setOrders(json.data);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || json.data.length);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar ordens.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, dateFrom, dateTo, sortBy, sortOrder, page, pageSize]);

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir ordem.");

      await fetchOrders();
      toast.success("Ordem excluída com sucesso!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir ordem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Ordens de Produção"
        description="Gerencie suas ordens de produção"
        actions={
          <Button asChild variant="outline">
            <Link href="/budgets?status=APPROVED">
              <Package className="w-4 h-4 mr-2" />
              Ver Orçamentos para Converter
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Toolbar>
            <ToolbarSection>
              <Input
                placeholder="Pesquisar por nº ordem, produto ou cliente"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                className="w-80"
              />

              <Select
                value={status}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="IN_PRODUCTION">Em Produção</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                  <SelectItem value="DELIVERED">Entregue</SelectItem>
                  <SelectItem value="ON_HOLD">Em Espera</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <label className="text-sm">De:</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPage(1);
                    setDateFrom(e.target.value);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">Até:</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPage(1);
                    setDateTo(e.target.value);
                  }}
                />
              </div>
            </ToolbarSection>

            <ToolbarSpacer />

            <ToolbarSection>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setPage(1);
                  setSortBy(value);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Data Criação</SelectItem>
                  <SelectItem value="numero_pedido">Nº Ordem</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="data_pedido">Data Pedido</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setPage(1);
                  setSortOrder(value as "asc" | "desc");
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPage(1);
                  setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <ColumnVisibilityDropdown table={table} />
            </ToolbarSection>
          </Toolbar>

          {error && <ErrorAlert message={error} />}

          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={(header.column.columnDef.meta as { className?: string } | undefined)?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length || 1}
                    className="h-64"
                  >
                    <EmptyState
                      icon={Package}
                      title="Nenhuma ordem encontrada"
                      description="Comece criando sua primeira ordem de produção."
                      action={
                        <Button asChild>
                          <Link href="/orders/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Ordem
                          </Link>
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPage(1);
              setPageSize(s);
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default function OrdersPage() {
  return (
    <AuthenticatedRoute>
      <OrdersContent />
    </AuthenticatedRoute>
  );
}
