"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface ChartData {
  labels: string[];
  datasets: [
    {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }
  ];
}

export function RevenueChart() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock data for now - replace with real API call
        const mockData: RevenueData[] = [
          { month: "Jan", revenue: 15000, orders: 15 },
          { month: "Fev", revenue: 22000, orders: 22 },
          { month: "Mar", revenue: 18000, orders: 18 },
          { month: "Abr", revenue: 25000, orders: 25 },
          { month: "Mai", revenue: 30000, orders: 30 },
          { month: "Jun", revenue: 28000, orders: 28 },
        ];

        const chartData: ChartData = {
          labels: mockData.map(d => d.month),
          datasets: [
            {
              label: "Receita (R$)",
              data: mockData.map(d => d.revenue),
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
            }
          ]
        };

        setChartData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">Erro ao carregar dados: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32">
              {chartData?.labels.map((label, index) => (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${(chartData.datasets[0].data[index] / Math.max(...chartData.datasets[0].data)) * 100}%`,
                      minHeight: "4px"
                    }}
                  />
                  <span className="text-xs mt-2">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>R$ {Math.min(...(chartData?.datasets[0].data || [0])).toLocaleString('pt-BR')}</span>
              <span>R$ {Math.max(...(chartData?.datasets[0].data || [0])).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}