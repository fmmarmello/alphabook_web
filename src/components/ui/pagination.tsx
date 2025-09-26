"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageCount: number;
  total?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
};

export function Pagination({ page, pageCount, total, pageSize, onPageChange, onPageSizeChange, className }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < pageCount;

  const goto = (p: number) => {
    const np = Math.max(1, Math.min(pageCount || 1, p));
    if (np !== page) onPageChange(np);
  };

  return (
    <div className={["flex items-center gap-2 justify-between", className].filter(Boolean).join(" ")}> 
      <div className="text-sm text-muted-foreground">
        Página {page} de {pageCount || 1}
        {typeof total === "number" ? <> • {total} itens</> : null}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            className="border rounded px-2 py-1"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        )}
        <Button variant="outline" onClick={() => goto(1)} disabled={!canPrev}>«</Button>
        <Button variant="outline" onClick={() => goto(page - 1)} disabled={!canPrev}>Anterior</Button>
        <Button variant="outline" onClick={() => goto(page + 1)} disabled={!canNext}>Próxima</Button>
        <Button variant="outline" onClick={() => goto(pageCount)} disabled={!canNext}>»</Button>
      </div>
    </div>
  );
}

