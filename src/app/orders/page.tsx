"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrencyBRL } from "@/lib/utils";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [centers, setCenters] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [centerId, setCenterId] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (clientId) params.set("clientId", String(clientId));
      if (centerId) params.set("centerId", String(centerId));
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err?.error || "Erro ao carregar ordens.");
        } catch {
          throw new Error("Erro ao carregar ordens.");
        }
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      setOrders(list);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || list.length);
    } catch (err) {
      setError("Erro ao carregar ordens.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err?.error || "Erro ao carregar clientes.");
        } catch {
          throw new Error("Erro ao carregar clientes.");
        }
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];
      setClients(list.map((c: any) => ({ id: c.id, name: c.name })));
    } catch {
      setClients([]);
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await fetch("/api/centers");
      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err?.error || "Erro ao carregar centros.");
        } catch {
          throw new Error("Erro ao carregar centros.");
        }
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];
      setCenters(list.map((c: any) => ({ id: c.id, name: c.name })));
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
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || "Erro ao excluir ordem.";
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join("; ")}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== "Failed to fetch") throw e;
          throw new Error("Erro ao excluir ordem.");
        }
      }
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir ordem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      <Navbar />
      <Card className="max-w-6xl w-full mt-8">
        <CardHeader>
          <CardTitle>Cadastro de Ordens de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <Toolbar>
            <ToolbarSection>
              <Button asChild>
                <a href="/orders/new">Nova OP</a>
              </Button>
              <Input placeholder="Pesquisar" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="w-56" />
              <select value={clientId as any} onChange={(e) => { setPage(1); setClientId(e.target.value ? Number(e.target.value) : ""); }} className="border rounded px-2 py-1">
                <option value="">Cliente</option>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={centerId as any} onChange={(e) => { setPage(1); setCenterId(e.target.value ? Number(e.target.value) : ""); }} className="border rounded px-2 py-1">
                <option value="">Centro</option>
                {centers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
              <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
              <select value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} className="border rounded px-2 py-1">
                <option value="id">ID</option>
                <option value="title">Título</option>
                <option value="tiragem">Tiragem</option>
                <option value="valorUnitario">Valor Unitário</option>
                <option value="valorTotal">Valor Total</option>
                <option value="numPaginasTotal">Páginas Total</option>
                <option value="numPaginasColoridas">Páginas Coloridas</option>
                <option value="prazoEntrega">Prazo</option>
                <option value="date">Data</option>
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
                <TableHead>Cliente</TableHead>
                <TableHead>Centro</TableHead>
                <TableHead>Título</TableHead>
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
              {Array.isArray(orders) && orders.map((order, idx) => (
                <TableRow key={order?.id ?? idx}>
                  <TableCell>{order.client?.name}</TableCell>
                  <TableCell>{order.center?.name}</TableCell>
                  <TableCell>{order.title}</TableCell>
                  <TableCell>{order.tiragem}</TableCell>
                  <TableCell>{order.formato}</TableCell>
                  <TableCell>{order.numPaginasTotal}</TableCell>
                  <TableCell>{order.numPaginasColoridas}</TableCell>
                  <TableCell>{formatCurrencyBRL(Number(order.valorUnitario) || 0)}</TableCell>
                  <TableCell>{formatCurrencyBRL(Number(order.valorTotal) || 0)}</TableCell>
                  <TableCell>{order.prazoEntrega}</TableCell>
                  <TableCell>{order.obs}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline"><a href={`/orders/${order.id}/edit`}>Editar</a></Button>
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
