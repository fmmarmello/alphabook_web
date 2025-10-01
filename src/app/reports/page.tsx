"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters } from "./ReportFilters";
import { ProductionReport } from "./ProductionReport";
import { FinancialReport } from "./FinancialReport";
import { SecureRoute } from "@/components/auth/ProtectedRoute";

type ReportType = "production" | "financial";

function ReportsContent() {
  const [reportType, setReportType] = useState<ReportType>("production");
  type Filters = { dateFrom?: string; dateTo?: string; editorial?: string; centerId?: string };
  type ProductionRow = { numero_pedido: string; data_entrega: string | Date | null; titulo: string; tiragem: number };
  type FinancialRow = { numero_pedido: string; tipo_produto: string; data_entrega: string; titulo: string; tiragem: number; valorUnitario: number; valorTotal: number };
  type ReportData = { orders: ProductionRow[]; totalTiragem: number } | { orders: FinancialRow[]; totalValorTotal: number } | null;
  const [reportData, setReportData] = useState<ReportData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isProductionData = (d: ReportData): d is { orders: ProductionRow[]; totalTiragem: number } => {
    return !!d && typeof d === 'object' && 'totalTiragem' in d;
  };
  const isFinancialData = (d: ReportData): d is { orders: FinancialRow[]; totalValorTotal: number } => {
    return !!d && typeof d === 'object' && 'totalValorTotal' in d;
  };

  const handleGenerateReport = async (filters: Filters) => {
    setLoading(true);
    setError("");
    setReportData(null);

    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.editorial) params.set("editorial", filters.editorial);
      if (filters.centerId) params.set("centerId", filters.centerId);

      const res = await fetch(`/api/reports/${reportType}?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch ${reportType} report`);
      }

      const json = await res.json();
      setReportData(json.data as ReportData);
    } catch (err: unknown) {
      // @ts-expect-error: err can be Error, provide fallback below
      setError(err.message || "Erro ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button
              variant={reportType === "production" ? "default" : "outline"}
              onClick={() => setReportType("production")}
            >
              Relatório de Produção
            </Button>
            <Button
              variant={reportType === "financial" ? "default" : "outline"}
              onClick={() => setReportType("financial")}
            >
              Relatório Financeiro
            </Button>
          </div>

          <ReportFilters onGenerate={handleGenerateReport} loading={loading} />

          <div className="mt-6">
            {loading && <div className="text-blue-600">Carregando...</div>}
            {error && <div className="text-red-600">{error}</div>}

            {reportData && reportType === "production" && isProductionData(reportData) && (
              <ProductionReport data={reportData} />
            )}
            {reportData && reportType === "financial" && isFinancialData(reportData) && (
              <FinancialReport data={reportData} />
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <SecureRoute>
      <ReportsContent />
    </SecureRoute>
  );
}
