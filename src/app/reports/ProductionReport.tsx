"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ProductionReportProps {
  data: {
    orders: any[];
    totalTiragem: number;
  };
}

function downloadCSV(data: any[], fileName: string) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '"')}"`);
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

export function ProductionReport({ data }: ProductionReportProps) {
  if (!data || !data.orders || data.orders.length === 0) {
    return <p>Nenhum dado para exibir.</p>;
  }

  const handleExport = () => {
    downloadCSV(data.orders, "relatorio_producao.csv");
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
            <TableHead>Data da Entrega</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Tiragem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.orders.map((order, idx) => (
            <TableRow key={idx}>
              <TableCell>{order.numero_pedido}</TableCell>
              <TableCell>{order.data_entrega ? new Date(order.data_entrega).toLocaleDateString() : ""}</TableCell>
              <TableCell>{order.titulo}</TableCell>
              <TableCell>{order.tiragem}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="text-right mt-4 font-bold">
        <p>Total de Tiragem: {data.totalTiragem}</p>
      </div>
    </div>
  );
}

