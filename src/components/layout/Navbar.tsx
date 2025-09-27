"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Dashboard" },
    { href: "/clients", label: "Clientes" },
    { href: "/centers", label: "Centros" },
    { href: "/orders", label: "Ordens" },
    { href: "/budgets", label: "Orçamentos" },
    { href: "/reports", label: "Relatórios" },
  ];

  return (
    <nav className="w-full bg-white shadow flex justify-center py-4 mb-8">
      <div className="flex gap-8">
        {menuItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname.startsWith(item.href) && item.href !== "/" || pathname === item.href ? "default" : "ghost"}
          >
            <a href={item.href}>{item.label}</a>
          </Button>
        ))}
      </div>
    </nav>
  );
}
