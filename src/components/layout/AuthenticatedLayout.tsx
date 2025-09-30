"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading, showLoginModal } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <>
        <div className="flex h-screen">
          {/* Sidebar skeleton */}
          <div className="w-64 border-r bg-background p-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-5/6" />
              </div>
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1 flex flex-col">
            <div className="h-16 border-b bg-background flex items-center px-4">
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex-1 p-4 md:p-6 lg:p-8">
              <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <AuthOverlay />
      </>
    );
  }

  // Show login modal for unauthenticated users
  if (!isAuthenticated || showLoginModal) {
    return (
      <>
        {/* Minimal layout without sidebar for unauthenticated users */}
        <div className="flex h-screen bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Alphabook</h1>
                <p className="text-muted-foreground">
                  Gestão de Clientes, Centros e Ordens
                </p>
              </div>
              <div className="text-muted-foreground">
                Please sign in to access the application
              </div>
            </div>
          </div>
        </div>
        <AuthOverlay />
      </>
    );
  }

  // Show full authenticated layout with sidebar
  return (
    <>
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear border-b">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <AuthOverlay />
    </>
  );
}