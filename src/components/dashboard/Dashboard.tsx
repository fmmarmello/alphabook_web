"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./RevenueChart";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { DashboardSummary, RecentOrder, RecentClient } from "@/types/models";

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
          fetch("/api/dashboard/summary", { credentials: 'include' }),
          fetch("/api/dashboard/recent-orders?limit=5", { credentials: 'include' }),
          fetch("/api/dashboard/recent-clients?limit=5", { credentials: 'include' }),
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
        <ErrorAlert 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-3xl font-bold">{summary?.totalClients ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-3xl font-bold">{summary?.totalOrders ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Faturado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <p className="text-3xl font-bold">
                R$ {(summary?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ordens Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-3xl font-bold">{summary?.pendingOrders ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Clientes Recentes</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    recentClients.slice(0, 5).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Ordens Recentes</h2>
        <Card>
          <CardContent className="p-0">
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
                      <TableCell className="font-medium">{order.client.name}</TableCell>
                      <TableCell>{order.title}</TableCell>
                      <TableCell className="font-medium">R$ {order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status || 'Pendente'} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}