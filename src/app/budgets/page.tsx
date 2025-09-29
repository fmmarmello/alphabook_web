// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\budgets\\page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL } from "@/lib/utils";



export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
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
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err?.error || "Erro ao carregar orçamentos.");
        } catch {
          throw new Error("Erro ao carregar orçamentos.");
        }
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      setBudgets(list);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || list.length);
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
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || "Erro ao excluir orçamento.";
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join("; ")}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== "Failed to fetch") throw e;
          throw new Error("Erro ao excluir orçamento.");
        }
      }
      await fetchBudgets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir orçamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen">
      
      <Card className="max-w-6xl w-full mt-8">
        <CardHeader>
          <CardTitle>Cadastro de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Toolbar>
            <ToolbarSection>
              <Button asChild>
                <a href="/budgets/new">Novo Orçamento</a>
              </Button>
              <Input placeholder="Pesquisar" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-56" />
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
              <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
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
          {loading && <div className="text-blue-600">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
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
              {Array.isArray(budgets) && budgets.map((budget, idx) => (
                <TableRow key={budget?.id ?? idx}>
                  <TableCell>{budget.titulo}</TableCell>`n                  <TableCell>{budget.numero_pedido ?? "-"}</TableCell>
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
                      <Button asChild variant="outline"><a href={`/budgets/${budget.id}/edit`}>Editar</a></Button>
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
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination
              page={page}
              pageCount={pageCount}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPage(1); setPageSize(s); }}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}


