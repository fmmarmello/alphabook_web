
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <aside className="w-64 bg-background text-foreground border-r">
      <nav className="flex flex-col gap-2 p-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Button
              key={link.href}
              asChild
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "justify-start hover:bg-accent hover:text-accent-foreground border-l-2",
                active ? "border-primary bg-accent/50" : "border-transparent"
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
