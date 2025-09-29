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
import type { CenterInput } from "@/lib/validation";



export default function CentersPage() {
  const [centers, setCenters] = useState<CenterInput[]>([]);
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

  const fetchCenters = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type && type !== 'all') params.set("type", type);
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
    <main className="flex flex-col items-center min-h-screen">
      
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
