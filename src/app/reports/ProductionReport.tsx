"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ProductionOrderRow {
  numero_pedido: string;
  data_entrega: string | Date | null;
  titulo: string;
  tiragem: number;
}

interface ProductionReportData {
  orders: ProductionOrderRow[];
  totalTiragem: number;
}

interface ProductionReportProps {
  data: ProductionReportData;
}

function downloadCSV<T extends object>(data: T[], fileName: string) {
  if (!data?.length) return;
  const first = data[0] as Record<string, unknown>;
  const headers = Object.keys(first);
  const rows = [headers.join(",")];
  for (const row of data) {
    const rec = row as Record<string, unknown>;
    const values = headers.map((h) => `"${String(rec[h] ?? "").replace(/\"/g, '"')}"`);
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
