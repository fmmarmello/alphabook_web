"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CenterInput } from "@/lib/validation";

function Navbar() {
  return (
    <nav className="w-full bg-white shadow flex justify-center py-4 mb-8">
      <div className="flex gap-8">
        <Button asChild variant="ghost"><a href="/">Dashboard</a></Button>
        <Button asChild variant="ghost"><a href="/clients">Clientes</a></Button>
        <Button asChild variant="ghost"><a href="/centers">Centros</a></Button>
        <Button asChild variant="ghost"><a href="/orders">Ordens</a></Button>
        <Button asChild variant="ghost"><a href="/reports">Relatórios</a></Button>
      </div>
    </nav>
  );
}

export default function CentersPage() {
  const [centers, setCenters] = useState<CenterInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCenters = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
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
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      setCenters(list);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || list.length);
    } catch (err) {
      setError("Erro ao carregar centros.");
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir centro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      <Navbar />
      <Card className="max-w-4xl w-full mt-8">
        <CardHeader>
          <CardTitle>Cadastro de Centros de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <Toolbar>
            <ToolbarSection>
              <Button asChild>
                <a href="/centers/new">Novo Centro</a>
              </Button>
              <Input placeholder="Pesquisar" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-56" />
              <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className="border rounded px-2 py-1">
                <option value="">Todos</option>
                <option value="Interno">Interno</option>
                <option value="Terceirizado">Terceirizado</option>
                <option value="Digital">Digital</option>
                <option value="Offset">Offset</option>
                <option value="Outro">Outro</option>
              </select>
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              <select value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} className="border rounded px-2 py-1">
                <option value="id">ID</option>
                <option value="name">Nome</option>
                <option value="type">Tipo</option>
              </select>
              <select value={sortOrder} onChange={(e) => { setPage(1); setSortOrder(e.target.value as any); }} className="border rounded px-2 py-1">
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="border rounded px-2 py-1">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </ToolbarSection>
          </Toolbar>
          {loading && <div className="text-blue-600">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(centers) && centers.map((center: any, idx) => (
                <TableRow key={center?.id ?? idx}>
                  <TableCell>{center.name}</TableCell>
                  <TableCell>{center.type}</TableCell>
                  <TableCell>{center.obs}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline"><a href={`/centers/${center.id}/edit`}>Editar</a></Button>
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
