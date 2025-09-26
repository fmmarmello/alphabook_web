"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar, ToolbarSpacer, ToolbarSection } from "@/components/ui/toolbar";
import { Pagination } from "@/components/ui/pagination";
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

const FILTERS = [
  { label: "Por Cliente", value: "client" },
  { label: "Por Período", value: "period" },
  { label: "Consolidado", value: "consolidated" },
  { label: "Gráfico", value: "graphical" },
];

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [byClient, setByClient] = useState<any[]>([]);
  const [filter, setFilter] = useState("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  function extractData(json: any) {
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data;
    return json?.data ?? [];
  }

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/orders${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const list = extractData(json);
      setOrders(list);
      const meta = json?.meta || {};
      setPageCount(Number(meta.pageCount) || 1);
      setTotal(Number(meta.total) || list.length);
    } catch (err) {
      setError("Erro ao carregar dados.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/reports/orders-summary${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSummary(json?.data ?? json);
    } catch (err) {
      setError("Erro ao carregar resumo.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchByClient = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/reports/orders-by-client${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setByClient(extractData(json));
    } catch (err) {
      setError("Erro ao carregar por cliente.");
      setByClient([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === "client") fetchByClient();
    if (filter === "consolidated") fetchSummary();
    if (filter === "period") fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, pageSize]);

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      <Navbar />
      <Card className="max-w-6xl w-full mt-8">
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex gap-2">
            {FILTERS.map(f => (
              <Button key={f.value} variant={filter === f.value ? "default" : "outline"} onClick={() => setFilter(f.value)}>
                {f.label}
              </Button>
            ))}
          </div>
          <Toolbar>
            <ToolbarSection>
              <div>
                <label className="text-sm">De</label>
                <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
              </div>
              <div>
                <label className="text-sm">Até</label>
                <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
              </div>
            </ToolbarSection>
            <ToolbarSpacer />
            <ToolbarSection>
              {filter === "client" && <Button onClick={fetchByClient}>Atualizar</Button>}
              {filter === "consolidated" && <Button onClick={fetchSummary}>Atualizar</Button>}
              {filter === "period" && <Button onClick={fetchOrders}>Atualizar</Button>}
              {filter === "period" && (
                <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="border rounded px-2 py-1">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              )}
            </ToolbarSection>
          </Toolbar>
          {loading && <div className="text-blue-600">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {filter === "period" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tiragem</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Prazo de entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{order.client?.name}</TableCell>
                    <TableCell>{order.center?.name}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>{order.tiragem}</TableCell>
                    <TableCell>{formatCurrencyBRL(Number(order.valorTotal) || 0)}</TableCell>
                    <TableCell>{order.prazoEntrega}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filter === "period" && (
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
          )}
          {filter === "client" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Qtd OPs</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byClient.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell>{row.orders}</TableCell>
                    <TableCell>{formatCurrencyBRL(Number(row.total) || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filter === "consolidated" && (
            <div className="space-y-4">
              <div className="flex gap-6">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total de OPs</div>
                  <div className="text-2xl font-semibold">{summary?.totalOrders ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                  <div className="text-2xl font-semibold">{formatCurrencyBRL(Number(summary?.totalAmount) || 0)}</div>
                </Card>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Centro</TableHead>
                    <TableHead>Qtd OPs</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byCenter ?? []).map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{row.centerName}</TableCell>
                      <TableCell>{row.orders}</TableCell>
                      <TableCell>{formatCurrencyBRL(Number(row.total) || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Placeholder for charts */}
          <div className="mt-8">
            <Card className="p-4 bg-gray-100 text-center">Gráficos e análises serão exibidos aqui.</Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
