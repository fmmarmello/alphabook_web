"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    badge?: {
      count: number
      variant?: "default" | "secondary" | "destructive" | "outline"
      showZero?: boolean
    }
    description?: string
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Alphabook</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              tooltip={item.description || item.title} 
              isActive={item.isActive}
            >
              <Link href={item.url} className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </div>
                {item.badge && (item.badge.showZero || item.badge.count > 0) && (
                  <Badge 
                    variant={item.badge.variant || "secondary"} 
                    className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center px-1.5"
                  >
                    {item.badge.count}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
