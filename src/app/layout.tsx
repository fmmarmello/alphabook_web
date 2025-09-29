
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
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
        </ThemeProvider>
      </body>
    </html>
  );
}
