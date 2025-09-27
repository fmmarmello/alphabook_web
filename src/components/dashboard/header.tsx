
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div>
        <Button>Nova Ordem</Button>
      </div>
    </header>
  );
}
