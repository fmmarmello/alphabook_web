"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

interface RootLayoutClientProps {
  children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <AuthenticatedLayout>
          {children}
        </AuthenticatedLayout>
      </AuthProvider>
    </ThemeProvider>
  );
}