"use client";
import { useEffect, useState, type ReactNode } from "react";
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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, type VisibilityState } from "@tanstack/react-table";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";
import { Book, Columns2 } from "lucide-react";
import type { Budget } from "@/types/models";
import type { PaginatedResponse } from "@/types/api";
import { toast } from "sonner";
import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute";
import { StatusBadge } from "@/components/ui/status-badge";

function BudgetsContent() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);


  // DataTable (shadcn + TanStack) columns and state
  const tableColumns: ColumnDef<Budget, unknown>[] = [
    {
      accessorKey: "numero_pedido",
      header: "Numero do Pedido",
      meta: { label: "Numero do Pedido", className: "w-[11rem]" },
      cell: ({ row }) => row.original.numero_pedido ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { label: "Status", className: "w-[11rem]" },
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: "titulo",
      header: "Titulo",
      meta: { label: "Titulo", className: "w-[11rem]" },
      cell: ({ row }) => (
        <div className="max-w-[18rem] truncate">{row.original.titulo}</div>
      ),
    },

    { accessorKey: "tiragem", header: "Tiragem", meta: { label: "Tiragem" } },
    { accessorKey: "formato", header: "Formato", meta: { label: "Formato" } },
    { accessorKey: "total_pgs", header: "Num paginas total", meta: { label: "Num paginas total" } },
    // { accessorKey: "pgs_colors", header: "Num paginas coloridas", meta: { label: "Num paginas coloridas" } },
    {
      accessorKey: "preco_unitario",
      header: "Valor Unitario",
      meta: { label: "Valor Unitario" },
      cell: ({ row }) => formatCurrencyBRL(Number(row.original.preco_unitario) || 0),
    },
    {
      accessorKey: "preco_total",
      header: "Valor Total",
      meta: { label: "Valor Total" },
      cell: ({ row }) => formatCurrencyBRL(Number(row.original.preco_total) || 0),
    },
    {
      accessorKey: "data_pedido", header: "Data Pedido", meta: { label: "Data Pedido" },
      cell: ({ row }) => formatDateBR(row.original.data_pedido)
    },
    {
      accessorKey: "data_entrega", header: "Data Entrega", meta: { label: "Data Entrega" },
      cell: ({ row }) => formatDateBR(row.original.data_entrega)
    },
    {
      accessorKey: "observacoes",
      header: "Observacoes",
      meta: { label: "Observacoes", className: "w-[18rem]" },
      cell: ({ row }) => (
        <div className="max-w-[20rem] break-words">{row.original.observacoes}</div>
      ),
    },
    {
      id: "actions",
      header: "Acoes",
      enableHiding: false,
      cell: ({ row }) => {
        const budget = row.original as Budget;
        console.log(row);
        return (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/budgets/${budget.id}/edit`}>Editar</Link>
            </Button>
            <ConfirmDialog
              title="Excluir orcamento"
              description="Esta acao nao pode ser desfeita."
              confirmLabel="Excluir"
              confirmVariant="destructive"
              onConfirm={() => handleDelete(budget.id)}
              trigger={<Button variant="destructive">Excluir</Button>}
            />
          </div>
        );
      },
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("budgets.table.columnVisibility");
      return saved ? (JSON.parse(saved) as VisibilityState) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("budgets.table.columnVisibility", JSON.stringify(columnVisibility));
    } catch {
      /* ignore */
    }
  }, [columnVisibility]);

  const table = useReactTable({
    data: budgets,
    columns: tableColumns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });









  // legacy manual column toggle handler removed (unused)



  const fetchBudgets = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/budgets?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar orçamentos.");
      const json: PaginatedResponse<Budget> = await res.json();
      setBudgets(json.data);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || json.data.length);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar orçamentos.");
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dateFrom, dateTo, sortBy, sortOrder, page, pageSize]);

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir orçamento.");
      await fetchBudgets();
      toast.success("Orçamento excluído com sucesso!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir orçamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Gerencie seus orçamentos"
        actions={
          <Button asChild>
            <Link href="/budgets/new">Novo Orçamento</Link>
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
              <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
              <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              <Select value={sortBy} onValueChange={(value) => { setPage(1); setSortBy(value); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="titulo">Título</SelectItem>
                  <SelectItem value="tiragem">Tiragem</SelectItem>
                  <SelectItem value="preco_unitario">Valor Unitário</SelectItem>
                  <SelectItem value="preco_total">Valor Total</SelectItem>
                  <SelectItem value="total_pgs">Páginas Total</SelectItem>
                  {/* <SelectItem value="pgs_colors">Páginas Coloridas</SelectItem> */}
                  <SelectItem value="prazo_producao">Prazo</SelectItem>
                  <SelectItem value="numero_pedido">Número do Pedido</SelectItem>
                  <SelectItem value="data_pedido">Data</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => { setPage(1); setSortOrder(value as "asc" | "desc"); }}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(value) => { setPage(1); setPageSize(Number(value)); }}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <Columns2 className="mr-2 h-4 w-4" /> Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mostrar colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      >
                        {(
                          column.columnDef.meta as { label?: string } | undefined
                        )?.label ?? column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </ToolbarSection>
          </Toolbar>
          {error && <ErrorAlert message={error} onRetry={fetchBudgets} />}
          {/* DataTable (TanStack) */}
          <Table className="w-full table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={(
                        header.column.columnDef.meta as { className?: string } | undefined
                      )?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length || 1}
                    className="h-64"
                  >
                    <EmptyState
                      icon={Book}
                      title="Nenhum orcamento encontrado"
                      description="Comece criando seu primeiro orcamento."
                      action={
                        <Button asChild>
                          <Link href="/budgets/new">Criar Primeiro Orcamento</Link>
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

export default function BudgetsPage() {
  return (
    <AuthenticatedRoute>
      <BudgetsContent />
    </AuthenticatedRoute>
  );
}
