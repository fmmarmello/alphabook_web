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
import { Building, Columns2 } from "lucide-react";
import type { Center } from "@/types/models";
import type { PaginatedResponse } from "@/types/api";
import { toast } from "sonner";
import { SecureRoute } from "@/components/auth/ProtectedRoute";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, type VisibilityState } from "@tanstack/react-table";

function CentersContent() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  // TanStack Table columns and visibility state
  const columns: ColumnDef<Center, unknown>[] = [
    { accessorKey: "name", header: "Nome", meta: { label: "Nome" } },
    { accessorKey: "type", header: "Tipo", meta: { label: "Tipo" } },
    { accessorKey: "obs", header: "Observacoes", meta: { label: "Observacoes" } },
    {
      id: "actions",
      header: "Acoes",
      enableHiding: false,
      cell: ({ row }) => {
        const center = row.original as Center;
        return (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/centers/${center.id}/edit`}>Editar</Link>
            </Button>
            <ConfirmDialog
              title="Excluir centro"
              description="Esta acao nao pode ser desfeita. Se houver ordens vinculadas, a exclusao sera bloqueada."
              confirmLabel="Excluir"
              confirmVariant="destructive"
              onConfirm={() => handleDelete(center.id)}
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
      const saved = localStorage.getItem("centers.table.columnVisibility");
      return saved ? (JSON.parse(saved) as VisibilityState) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("centers.table.columnVisibility", JSON.stringify(columnVisibility));
    } catch {
      /* ignore */
    }
  }, [columnVisibility]);

  const table = useReactTable({
    data: centers,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const fetchCenters = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type && type !== "all") params.set("type", type);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/centers?${params.toString()}`);
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err?.error || "Erro ao carregar centros.");
        } catch {
          throw new Error("Erro ao carregar centros.");
        }
      }
      const json: PaginatedResponse<Center> = await res.json();
      setCenters(json.data);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || json.data.length);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar centros.");
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, sortBy, sortOrder, page, pageSize]);

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/centers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || "Erro ao excluir centro.";
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join("; ")}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== "Failed to fetch") throw e;
          throw new Error("Erro ao excluir centro.");
        }
      }
      await fetchCenters();
      toast.success("Centro de produção excluído com sucesso!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir centro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Centros de Produção"
        description="Gerencie seus centros de produção"
        actions={
          <Button asChild>
            <Link href="/centers/new">Novo Centro</Link>
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
              <Select value={type} onValueChange={(value) => { setPage(1); setType(value); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Interno">Interno</SelectItem>
                  <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                  <SelectItem value="Digital">Digital</SelectItem>
                  <SelectItem value="Offset">Offset</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              <Select value={sortBy} onValueChange={(value) => { setPage(1); setSortBy(value); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
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
                        {(column.columnDef as any).meta?.label ?? column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </ToolbarSection>
          </Toolbar>
          {error && <ErrorAlert message={error} onRetry={fetchCenters} />}
          {/* DataTable with column visibility */}
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
                        icon={Building}
                        title="Nenhum centro de producao encontrado"
                        description="Comece criando seu primeiro centro de producao."
                        action={
                          <Button asChild>
                            <Link href="/centers/new">Criar Primeiro Centro</Link>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : centers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64">
                      <EmptyState
                        icon={Building}
                        title="Nenhum centro de produção encontrado"
                        description="Comece criando seu primeiro centro de produção."
                        action={
                          <Button asChild>
                            <Link href="/centers/new">Criar Primeiro Centro</Link>
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  centers.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell>{center.name}</TableCell>
                      <TableCell>{center.type}</TableCell>
                      <TableCell>{center.obs}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/centers/${center.id}/edit`}>Editar</Link>
                          </Button>
                          <ConfirmDialog
                            title="Excluir centro"
                            description="Esta ação não pode ser desfeita. Se houver ordens vinculadas, a exclusão será bloqueada."
                            confirmLabel="Excluir"
                            confirmVariant="destructive"
                            onConfirm={() => handleDelete(center.id)}
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

export default function CentersPage() {
  return (
    <SecureRoute>
      <CentersContent />
    </SecureRoute>
  );
}
