
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootLayoutClient } from "@/components/layout/RootLayoutClient";
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alphabook",
  description: "Gestão de Clientes, Centros e Ordens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <Suspense>
            <RootLayoutClient>
              {children}
            </RootLayoutClient>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}
