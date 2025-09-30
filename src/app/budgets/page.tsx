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
import { formatCurrencyBRL } from "@/lib/utils";
import { Book } from "lucide-react";
import type { Budget } from "@/types/models";
import type { PaginatedResponse } from "@/types/api";
import { toast } from "sonner";
import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute";

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
                  <SelectItem value="pgs_colors">Páginas Coloridas</SelectItem>
                  <SelectItem value="prazo_producao">Prazo</SelectItem>
                  <SelectItem value="numero_pedido">Número do Pedido</SelectItem>
                  <SelectItem value="data_pedido">Data</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => { setPage(1); setSortOrder(value as any); }}>
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
            </ToolbarSection>
          </Toolbar>
          {error && <ErrorAlert message={error} onRetry={fetchBudgets} />}
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Número do Pedido</TableHead>
                  <TableHead>Tiragem</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Nº páginas total</TableHead>
                  <TableHead>Nº páginas coloridas</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Prazo de produção</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : budgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-64">
                      <EmptyState
                        icon={Book}
                        title="Nenhum orçamento encontrado"
                        description="Comece criando seu primeiro orçamento."
                        action={
                          <Button asChild>
                            <Link href="/budgets/new">Criar Primeiro Orçamento</Link>
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.titulo}</TableCell>
                      <TableCell>{budget.numero_pedido ?? "-"}</TableCell>
                      <TableCell>{budget.tiragem}</TableCell>
                      <TableCell>{budget.formato}</TableCell>
                      <TableCell>{budget.total_pgs}</TableCell>
                      <TableCell>{budget.pgs_colors}</TableCell>
                      <TableCell>{formatCurrencyBRL(Number(budget.preco_unitario) || 0)}</TableCell>
                      <TableCell>{formatCurrencyBRL(Number(budget.preco_total) || 0)}</TableCell>
                      <TableCell>{budget.prazo_producao}</TableCell>
                      <TableCell>{budget.observacoes}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/budgets/${budget.id}/edit`}>Editar</Link>
                          </Button>
                          <ConfirmDialog
                            title="Excluir orçamento"
                            description="Esta ação não pode ser desfeita."
                            confirmLabel="Excluir"
                            confirmVariant="destructive"
                            onConfirm={() => handleDelete(budget.id)}
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