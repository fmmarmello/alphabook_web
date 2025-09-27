"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ClientInput } from "@/lib/validation";



export default function ClientsPage() {
  const [clients, setClients] = useState<ClientInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/clients?${params.toString()}`);
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err?.error || "Erro ao carregar clientes.");
        } catch {
          throw new Error("Erro ao carregar clientes.");
        }
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      setClients(list);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || list.length);
    } catch (err) {
      setError("Erro ao carregar clientes.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [q, sortBy, sortOrder, page, pageSize]);

  const handleDelete = async (id: number) => {
    if (!confirm("Confirmar exclusão do cliente?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || "Erro ao excluir cliente.";
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fieldErrors = details?.fieldErrors;
          const fieldMsgs = fieldErrors && typeof fieldErrors === "object" ? Object.values(fieldErrors).flat().filter(Boolean) : [];
          const allMsgs = [...formErrors, ...fieldMsgs];
          const fullMsg = allMsgs.length ? `${msg}: ${allMsgs.join("; ")}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== "Failed to fetch") throw e;
          throw new Error("Erro ao excluir cliente.");
        }
      }
      await fetchClients();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      
      <Card className="max-w-4xl w-full mt-8">
        <CardHeader>
          <CardTitle>Cadastro de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Toolbar>
            <ToolbarSection>
              <Button asChild>
                <a href="/clients/new">Novo Cliente</a>
              </Button>
              <Input placeholder="Pesquisar" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-56" />
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              <select value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} className="border rounded px-2 py-1">
                <option value="id">ID</option>
                <option value="name">Nome</option>
                <option value="email">Email</option>
                <option value="cnpjCpf">CNPJ/CPF</option>
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
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="sticky right-0 bg-white">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(clients) && clients.map((client: any, idx) => (
                <TableRow key={client?.id ?? idx}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.cnpjCpf}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.address}</TableCell>
                  <TableCell className="sticky right-0 bg-white">
                    <div className="flex gap-2">
                      <Button asChild variant="outline"><a href={`/clients/${client.id}/edit`}>Editar</a></Button>
                      <ConfirmDialog
                        title="Excluir cliente"
                        description="Esta ação não pode ser desfeita. Se houver ordens vinculadas, a exclusão será bloqueada."
                        confirmLabel="Excluir"
                        confirmVariant="destructive"
                        onConfirm={() => handleDelete(client.id)}
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
