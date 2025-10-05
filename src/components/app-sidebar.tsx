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
  ClipboardCheck,
  Package,
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

// Navigation counts interface
interface NavigationCounts {
  pendingBudgets: number
  activeOrders: number
}

// Hook to fetch navigation counts
function useNavigationCounts() {
  const [counts, setCounts] = React.useState<NavigationCounts>({
    pendingBudgets: 0,
    activeOrders: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchCounts() {
      try {
        const response = await fetch('/api/navigation/counts')
        if (response.ok) {
          const result = await response.json()
          setCounts(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch navigation counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { counts, loading }
}

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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { counts, loading } = useNavigationCounts()

  // Navigation items with reordered structure: Budgets → Orders workflow
  const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      description: "Visão geral do sistema"
    },
    {
      title: "Clientes",
      url: "/clients",
      icon: Users,
      description: "Gerenciar clientes e contatos"
    },
    {
      title: "Centros",
      url: "/centers",
      icon: Building2,
      description: "Gerenciar centros de produção"
    },
    {
      title: "Orçamentos",
      url: "/budgets",
      icon: ClipboardCheck,
      description: "Criar e aprovar orçamentos",
      badge: {
        count: loading ? 0 : counts.pendingBudgets,
        variant: "destructive" as const,
        showZero: false
      }
    },
    {
      title: "Ordens",
      url: "/orders",
      icon: Package,
      description: "Gerenciar pedidos de produção",
      badge: {
        count: loading ? 0 : counts.activeOrders,
        variant: "default" as const,
        showZero: false
      }
    },
    {
      title: "Relatórios",
      url: "/reports",
      icon: BarChart3,
      description: "Análises e relatórios financeiros"
    },
  ]

  // Update active state based on current pathname
  const navMainWithActive = navMain.map((item) => ({
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
