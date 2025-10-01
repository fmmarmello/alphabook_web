"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toolbar, ToolbarSection, ToolbarSpacer } from "@/components/ui/toolbar";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Center } from "@/types/models";

type FiltersForm = {
  dateFrom: string;
  dateTo: string;
  editorial: string;
  centerId: string;
};

interface ReportFiltersProps {
  onGenerate: (filters: FiltersForm) => void;
  loading: boolean;
}

export function ReportFilters({ onGenerate, loading }: ReportFiltersProps) {
  const form = useForm<FiltersForm>({
    defaultValues: { dateFrom: "", dateTo: "", editorial: "all", centerId: "all" },
  });

  const [centers, setCenters] = useState<Center[]>([]);
  const [editorials, setEditorials] = useState<string[]>([]);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    async function fetchFiltersData() {
      try {
        const [centersRes, editorialsRes] = await Promise.all([
          fetch("/api/centers"),
          fetch("/api/orders/editorials"),
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
    onGenerate(form.getValues());
  };

  const handleReset = () => {
    form.reset({ dateFrom: "", dateTo: "", editorial: "all", centerId: "all" });
    setRange(undefined);
  };

  const formatDate = (d?: Date) => (d ? new Date(d).toLocaleDateString("pt-BR") : "");
  const applyRange = (r?: DateRange) => {
    setRange(r);
    const from = r?.from ? new Date(r.from) : undefined;
    const to = r?.to ? new Date(r.to) : undefined;
    const fmt = (x?: Date) => (x ? x.toISOString().slice(0, 10) : "");
    form.setValue("dateFrom", fmt(from));
    form.setValue("dateTo", fmt(to));
  };

  return (
    <Form {...form}>
      <Toolbar>
        <ToolbarSection className="gap-3">
          <FormItem className="w-[260px]">
            <FormLabel>Período</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !range && "text-muted-foreground"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range?.from ? (
                    range.to ? (
                      <span>
                        {formatDate(range.from)} – {formatDate(range.to)}
                      </span>
                    ) : (
                      <span>{formatDate(range.from)}</span>
                    )
                  ) : (
                    <span>Selecionar datas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={range}
                  onSelect={applyRange}
                />
              </PopoverContent>
            </Popover>
          </FormItem>

          <FormField
            control={form.control}
            name="editorial"
            render={({ field }) => (
              <FormItem className="min-w-[200px]">
                <FormLabel>Grupo Editorial</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {editorials.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="centerId"
            render={({ field }) => (
              <FormItem className="min-w-[200px]">
                <FormLabel>Centro de Produção</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {centers.map((center) => (
                        <SelectItem key={center.id} value={String(center.id)}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </ToolbarSection>
        <ToolbarSpacer />
        <ToolbarSection className="gap-2">
          <Button variant="outline" type="button" onClick={handleReset} disabled={loading}>
            Limpar
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={loading}>
            {loading ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </ToolbarSection>
      </Toolbar>
    </Form>
  );
}

