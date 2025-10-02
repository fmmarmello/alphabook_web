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
import { Book } from "lucide-react";
import type { Order, Client, Center } from "@/types/models";
import type { PaginatedResponse } from "@/types/api";
import { toast } from "sonner";
import { SecureRoute } from "@/components/auth/ProtectedRoute";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import { ColumnVisibilityDropdown, useTableWithColumnVisibility } from "@/components/ui/column-visibility";

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Pick<Client, 'id' | 'name'>[]>([]);
  const [centers, setCenters] = useState<Pick<Center, 'id' | 'name'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [clientId, setClientId] = useState<string>("all");
  const [centerId, setCenterId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  // TanStack Table columns
  const columns: ColumnDef<Order, unknown>[] = [
    {
      id: "client",
      header: "Cliente",
      meta: { label: "Cliente" },
      cell: ({ row }) => row.original.client?.name ?? "",
    },
    {
      id: "center",
      header: "Centro",
      meta: { label: "Centro" },
      cell: ({ row }) => row.original.center?.name ?? "",
    },
    { accessorKey: "title", header: "Titulo", meta: { label: "Titulo" } },
    {
      accessorKey: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => <StatusBadge status={row.original.status || "Pendente"} />,
    },
    { accessorKey: "tiragem", header: "Tiragem", meta: { label: "Tiragem" } },
    { accessorKey: "formato", header: "Formato", meta: { label: "Formato" } },
    {
      accessorKey: "numPaginasTotal",
      header: "Num paginas total",
      meta: { label: "Num paginas total" },
    },
    {
      accessorKey: "numPaginasColoridas",
      header: "Num paginas coloridas",
      meta: { label: "Num paginas coloridas" },
    },
    {
      accessorKey: "valorUnitario",
      header: "Valor Unitario",
      meta: { label: "Valor Unitario" },
      cell: ({ row }) => formatCurrencyBRL(Number(row.original.valorUnitario) || 0),
    },
    {
      accessorKey: "valorTotal",
      header: "Valor Total",
      meta: { label: "Valor Total" },
      cell: ({ row }) => formatCurrencyBRL(Number(row.original.valorTotal) || 0),
    },
    { accessorKey: "prazoEntrega", header: "Prazo de entrega", meta: { label: "Prazo de entrega" } },
    { accessorKey: "obs", header: "Observacoes", meta: { label: "Observacoes" } },
    {
      id: "actions",
      header: "Acoes",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original as Order;
        return (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/orders/${order.id}/edit`}>Editar</Link>
            </Button>
            <ConfirmDialog
              title="Excluir ordem"
              description="Esta acao nao pode ser desfeita."
              confirmLabel="Excluir"
              confirmVariant="destructive"
              onConfirm={() => handleDelete(order.id)}
              trigger={<Button variant="destructive">Excluir</Button>}
            />
          </div>
        );
      },
    },
  ];

  const { table } = useTableWithColumnVisibility<Order>({
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
      if (clientId && clientId !== "all") params.set("clientId", String(clientId));
      if (centerId && centerId !== "all") params.set("centerId", String(centerId));
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar ordens.");
      const json: PaginatedResponse<Order> = await res.json();
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

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Erro ao carregar clientes.");
      const data: PaginatedResponse<Client> = await res.json();
      setClients(data.data.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setClients([]);
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await fetch("/api/centers");
      if (!res.ok) throw new Error("Erro ao carregar centros.");
      const data: PaginatedResponse<Center> = await res.json();
      setCenters(data.data.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setCenters([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, clientId, centerId, dateFrom, dateTo, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchClients();
    fetchCenters();
  }, []);

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir ordem.");
      await fetchOrders();
      toast.success("Ordem de produção excluída com sucesso!");
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
          <Button asChild>
            <Link href="/orders/new">Nova OP</Link>
          </Button>
        }
      />
      <Card className="w-full">
        <CardContent>
          <Toolbar>
            <ToolbarSection>
              <Input
                placeholder="Pesquisar"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                className="w-56"
              />
              <Select
                value={String(clientId)}
                onValueChange={(value) => {
                  setPage(1);
                  setClientId(value);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(centerId)}
                onValueChange={(value) => {
                  setPage(1);
                  setCenterId(value);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {centers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">De:</label>
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
                <label className="text-sm font-medium">Até:</label>
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
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="tiragem">Tiragem</SelectItem>
                  <SelectItem value="valorUnitario">Valor Unitário</SelectItem>
                  <SelectItem value="valorTotal">Valor Total</SelectItem>
                  <SelectItem value="numPaginasTotal">Nº páginas total</SelectItem>
                  <SelectItem value="numPaginasColoridas">Nº páginas coloridas</SelectItem>
                  <SelectItem value="prazoEntrega">Prazo</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
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
                  <SelectValue placeholder="Order" />
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
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Page size" />
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
          {error && <ErrorAlert message={error} onRetry={fetchOrders} />}
          {/* Legacy table disabled in favor of DataTable */}
          <div className="w-full overflow-x-auto mb-4">
            <Table className="w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
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
                        <TableCell key={String(col.id)}>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={table.getVisibleLeafColumns().length || 1} className="h-64">
                      <EmptyState
                        icon={Book}
                        title="Nenhuma ordem de producao encontrada"
                        description="Comece criando sua primeira ordem de producao para gerenciar sua producao"
                        action={
                          <Button asChild>
                            <Link href="/orders/new">Criar Primeira OP</Link>
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
          </div>
          {false && (
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tiragem</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Nº páginas total</TableHead>
                  <TableHead>Nº páginas coloridas</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Prazo de entrega</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-64">
                      <EmptyState
                        icon={Book}
                        title="Nenhuma ordem de produção encontrada"
                        description="Comece criando sua primeira ordem de produção para gerenciar sua produção"
                        action={
                          <Button asChild>
                            <Link href="/orders/new">Criar Primeira OP</Link>
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.client?.name}</TableCell>
                      <TableCell>{order.center?.name}</TableCell>
                      <TableCell>{order.title}</TableCell>
                      <TableCell><StatusBadge status={order.status || 'Pendente'} /></TableCell>
                      <TableCell>{order.tiragem}</TableCell>
                      <TableCell>{order.formato}</TableCell>
                      <TableCell>{order.numPaginasTotal}</TableCell>
                      <TableCell>{order.numPaginasColoridas}</TableCell>
                      <TableCell>
                        {formatCurrencyBRL(Number(order.valorUnitario) || 0)}
                      </TableCell>
                      <TableCell>
                        {formatCurrencyBRL(Number(order.valorTotal) || 0)}
                      </TableCell>
                      <TableCell>{order.prazoEntrega}</TableCell>
                      <TableCell>{order.obs}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/orders/${order.id}/edit`}>Editar</Link>
                          </Button>
                          <ConfirmDialog
                            title="Excluir ordem"
                            description="Esta ação não pode ser desfeita."
                            confirmLabel="Excluir"
                            confirmVariant="destructive"
                            onConfirm={() => handleDelete(order.id)}
                            trigger={<Button variant="destructive">Excluir</Button>}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )))
                }
              </TableBody>
            </Table>
          </div>
          )}
          <div className="mt-4">
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
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function OrdersPage() {
  return (
    <SecureRoute>
      <OrdersContent />
    </SecureRoute>
  );
}
