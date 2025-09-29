
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cardVariants, cardHeaderVariants, cardContentVariants } from "./styles";

interface DashboardSummary {
  totalClients: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: number;
  title: string;
  valorTotal: number;
  status: string;
  date: string;
  numero_pedido: string | null;
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  center: {
    id: number;
    name: string;
  };
}

interface RecentClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  cnpjCpf: string;
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, ordersRes, clientsRes] = await Promise.all([
          fetch("/api/dashboard/summary"),
          fetch("/api/dashboard/recent-orders?limit=5"),
          fetch("/api/dashboard/recent-clients?limit=5"),
        ]);

        if (!summaryRes.ok || !ordersRes.ok || !clientsRes.ok) {
          throw new Error("Erro ao carregar dados do dashboard");
        }

        const [summaryData, ordersData, clientsData] = await Promise.all([
          summaryRes.json(),
          ordersRes.json(),
          clientsRes.json(),
        ]);

        setSummary(summaryData.data);
        setRecentOrders(ordersData.data);
        setRecentClients(clientsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Erro ao carregar dados: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className={cardVariants({ variant: "default" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "default" })}>
            {loading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-3xl font-bold">{summary?.totalClients ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card className={cardVariants({ variant: "default" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Total de Ordens</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "default" })}>
            {loading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-3xl font-bold">{summary?.totalOrders ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card className={cardVariants({ variant: "highlight" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Total Faturado</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "lg" })}>
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <p className="text-3xl font-bold">
                R$ {(summary?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className={cardVariants({ variant: "default" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Ordens Pendentes</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "default" })}>
            {loading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-3xl font-bold">{summary?.pendingOrders ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Ordens Recentes</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.client.name}</TableCell>
                      <TableCell>{order.title}</TableCell>
                      <TableCell>R$ {order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{order.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Clientes Recentes</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  recentClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
