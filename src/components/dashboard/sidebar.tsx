
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
  { href: "/centers", label: "Centros" },
  { href: "/orders", label: "Ordens" },
  { href: "/budgets", label: "Orçamentos" },
  { href: "/reports", label: "Relatórios" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-100 p-4">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Button
            key={link.href}
            asChild
            variant={pathname === link.href ? "default" : "ghost"}
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
