
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toolbar, ToolbarSection, ToolbarSpacer } from "@/components/ui/toolbar";
import { Center } from "@prisma/client";

interface ReportFiltersProps {
  onGenerate: (filters: any) => void;
  loading: boolean;
}

export function ReportFilters({ onGenerate, loading }: ReportFiltersProps) {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    editorial: "",
    centerId: "",
  });
  const [centers, setCenters] = useState<Center[]>([]);
  const [editorials, setEditorials] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFiltersData() {
      try {
        const [centersRes, editorialsRes] = await Promise.all([
          fetch("/api/centers"),
          fetch("/api/orders/editorials"), // Assuming an endpoint to get unique editorials
        ]);
        const centersData = await centersRes.json();
        const editorialsData = await editorialsRes.json();
        setCenters(centersData.data || []);
        setEditorials(editorialsData.data || []);
      } catch (error) {
        console.error("Failed to fetch filters data", error);
      }
    }
    fetchFiltersData();
  }, []);

  const handleGenerate = () => {
    onGenerate(filters);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Toolbar>
      <ToolbarSection>
        <div>
          <label className="text-sm">De</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Até</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Grupo Editorial</label>
          <Select onValueChange={(value) => handleFilterChange("editorial", value)} value={filters.editorial}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {editorials.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Centro de Produção</label>
          <Select onValueChange={(value) => handleFilterChange("centerId", value)} value={filters.centerId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {centers.map((center) => (
                <SelectItem key={center.id} value={String(center.id)}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ToolbarSection>
      <ToolbarSpacer />
      <ToolbarSection>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Gerando..." : "Gerar Relatório"}
        </Button>
      </ToolbarSection>
    </Toolbar>
  );
}
