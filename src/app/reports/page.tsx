"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters } from "./ReportFilters";
import { ProductionReport } from "./ProductionReport";
import { FinancialReport } from "./FinancialReport";



type ReportType = "production" | "financial";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("production");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateReport = async (filters: any) => {
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
      setReportData(json.data);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-900">
      <Card className="max-w-6xl w-full mt-8">
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

          <div className="mt-8">
            {loading && <div className="text-blue-600">Carregando...</div>}
            {error && <div className="text-red-600">{error}</div>}

            {reportData && reportType === "production" && <ProductionReport data={reportData} />}
            {reportData && reportType === "financial" && <FinancialReport data={reportData} />}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}