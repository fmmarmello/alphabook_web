"use client"

import * as React from "react"
import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  Users,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/components/auth/AuthProvider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Alphabook User",
    email: "user@alphabook.com",
    avatar: "/avatars/alphabook-user.jpg",
  },
  teams: [
    {
      name: "Alphabook",
      logo: GalleryVerticalEnd,
      plan: "Business",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Clientes",
      url: "/clients",
      icon: Users,
    },
    {
      title: "Centros",
      url: "/centers",
      icon: Building2,
    },
    {
      title: "Ordens",
      url: "/orders",
      icon: FileText,
    },
    {
      title: "Orçamentos",
      url: "/budgets",
      icon: Calculator,
    },
    {
      title: "Relatórios",
      url: "/reports",
      icon: BarChart3,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Update active state based on current pathname
  const navMainWithActive = data.navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/")),
  }))

  // Use authenticated user data if available
  const displayUser = user ? {
    name: user.name,
    email: user.email,
    avatar: "/avatars/default.jpg",
  } : data.user

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
