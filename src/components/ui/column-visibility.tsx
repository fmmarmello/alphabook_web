"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns2 } from "lucide-react"
import {
  type ColumnDef,
  type VisibilityState,
  getCoreRowModel,
  useReactTable,
  type Table as ReactTable,
} from "@tanstack/react-table"

export function useTableWithColumnVisibility<TData>(opts: {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  storageKey: string
}) {
  const { data, columns, storageKey } = opts
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    () => {
      if (typeof window === "undefined") return {}
      try {
        const saved = localStorage.getItem(storageKey)
        return saved ? (JSON.parse(saved) as VisibilityState) : {}
      } catch {
        return {}
      }
    }
  )

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnVisibility))
    } catch {
      /* ignore */
    }
  }, [columnVisibility, storageKey])

  const table = useReactTable<TData>({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return { table, columnVisibility, setColumnVisibility }
}

export function ColumnVisibilityDropdown<TData>({
  table,
  label = "Colunas",
  className,
}: {
  table: ReactTable<TData>
  label?: string
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className ?? "whitespace-nowrap"}>
          <Columns2 className="mr-2 h-4 w-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mostrar colunas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            >
              {(
                column.columnDef.meta as { label?: string } | undefined
              )?.label ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
