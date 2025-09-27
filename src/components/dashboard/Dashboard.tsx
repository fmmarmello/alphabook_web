
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { cardVariants, cardHeaderVariants, cardContentVariants } from "./styles";

// Fictional data
const totalClients = 125;
const totalOrders = 543;
const totalBilled = 125430.50;
const pendingOrders = 15;

const recentOrders = [
  { id: 1, client: "Cliente A", title: "Livro de Receitas", value: 1250.00, status: "Em produção" },
  { id: 2, client: "Cliente B", title: "Catálogo de Produtos", value: 2500.00, status: "Aguardando aprovação" },
  { id: 3, client: "Cliente C", title: "Revista Mensal", value: 800.00, status: "Concluído" },
  { id: 4, client: "Cliente D", title: "Cartões de Visita", value: 250.00, status: "Em produção" },
  { id: 5, client: "Cliente E", title: "Relatório Anual", value: 3500.00, status: "Concluído" },
];

const recentClients = [
  { id: 1, name: "Cliente A", email: "cliente.a@example.com", phone: "(11) 98765-4321" },
  { id: 2, name: "Cliente B", email: "cliente.b@example.com", phone: "(21) 91234-5678" },
  { id: 3, name: "Cliente C", email: "cliente.c@example.com", phone: "(31) 99999-8888" },
  { id: 4, name: "Cliente D", email: "cliente.d@example.com", phone: "(41) 98888-7777" },
  { id: 5, name: "Cliente E", email: "cliente.e@example.com", phone: "(51) 97777-6666" },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className={cardVariants({ variant: "default" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "default" })}>
            <p className="text-3xl font-bold">{totalClients}</p>
            <p className="text-sm text-gray-500">* Dados fictícios</p>
          </CardContent>
        </Card>
        <Card className={cardVariants({ variant: "default" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Total de Ordens</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "default" })}>
            <p className="text-3xl font-bold">{totalOrders}</p>
            <p className="text-sm text-gray-500">* Dados fictícios</p>
          </CardContent>
        </Card>
        <Card className={cardVariants({ variant: "highlight" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Total Faturado</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "lg" })}>
            <p className="text-3xl font-bold">R$ {totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-500">* Dados fictícios</p>
          </CardContent>
        </Card>
        <Card className={cardVariants({ variant: "default" })}>
          <CardHeader className={cardHeaderVariants({ size: "default" })}>
            <CardTitle>Ordens Pendentes</CardTitle>
          </CardHeader>
          <CardContent className={cardContentVariants({ size: "default" })}>
            <p className="text-3xl font-bold">{pendingOrders}</p>
            <p className="text-sm text-gray-500">* Dados fictícios</p>
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
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.client}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
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
                {recentClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
