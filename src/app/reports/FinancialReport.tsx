"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL } from "@/lib/utils";

interface Order {
  numero_pedido: string;
  tipo_produto: string;
  data_entrega: string;
  titulo: string;
  tiragem: number;
  valorUnitario: number;
  valorTotal: number;
}

interface FinancialReportProps {
  data: {
    orders: Order[];
    totalValorTotal: number;
  };
}

function downloadCSV(data: Order[], fileName: string) {
  if (!data?.length) return;
  const headers = [
    "Numero OP",
    "Tipo Produto",
    "Data Entrega",
    "Titulo",
    "Tiragem",
    "Valor Unitario",
    "Valor Total",
  ];
  const rows = [headers.join(",")];
  for (const row of data) {
    const values = [
      row.numero_pedido,
      row.tipo_produto,
      row.data_entrega ? new Date(row.data_entrega).toLocaleDateString() : "",
      row.titulo,
      row.tiragem,
      row.valorUnitario,
      row.valorTotal,
    ].map((v) => `"${String(v ?? "").replace(/"/g, '"')}"`);
    rows.push(values.join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function FinancialReport({ data }: FinancialReportProps) {
  if (!data || !data.orders || data.orders.length === 0) {
    return <p>Nenhum dado para exibir.</p>;
  }

  const handleExport = () => {
    downloadCSV(data.orders, "relatorio_financeiro.csv");
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleExport}>Exportar para CSV</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número da OP</TableHead>
            <TableHead>Tipo de Produto</TableHead>
            <TableHead>Data da Entrega</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Tiragem</TableHead>
            <TableHead>Valor Unitário</TableHead>
            <TableHead>Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.orders.map((order, idx) => (
            <TableRow key={idx}>
              <TableCell>{order.numero_pedido}</TableCell>
              <TableCell>{order.tipo_produto}</TableCell>
              <TableCell>{order.data_entrega ? new Date(order.data_entrega).toLocaleDateString() : ""}</TableCell>
              <TableCell>{order.titulo}</TableCell>
              <TableCell>{order.tiragem}</TableCell>
              <TableCell>{formatCurrencyBRL(order.valorUnitario)}</TableCell>
              <TableCell>{formatCurrencyBRL(order.valorTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="text-right mt-4 font-bold">
        <p>Valor Total: {formatCurrencyBRL(data.totalValorTotal)}</p>
      </div>
    </div>
  );
}

