"use client";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useState } from "react";

function Navbar() {
  return (
    <nav className="w-full bg-white shadow flex justify-center py-4 mb-8">
      <div className="flex gap-8">
        <Link href="/clients">
          <Button variant="ghost">Clientes</Button>
        </Link>
        <Link href="/centers">
          <Button variant="ghost">Centros</Button>
        </Link>
        <Link href="/orders">
          <Button variant="ghost">Ordens</Button>
        </Link>
        <Link href="/reports">
          <Button variant="ghost">Relatórios</Button>
        </Link>
      </div>
    </nav>
  );
}

export default function Home() {
  const { register, handleSubmit, reset } = useForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState("");

  const onSubmit = (data: any) => {
    setResult(`Ação enviada: ${data.quickAction}`);
    reset();
    setDialogOpen(false);
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      <Navbar />
      <Card className="max-w-xl w-full mt-8">
        <CardHeader>
          <CardTitle>ALPHABOOK - Sistema de Produção Gráfica</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/clients">
            <Button className="w-full">Clientes</Button>
          </Link>
          <Link href="/centers">
            <Button className="w-full">Centros de Produção</Button>
          </Link>
          <Link href="/orders">
            <Button className="w-full">Ordens de Produção</Button>
          </Link>
          <Link href="/reports">
            <Button className="w-full">Relatórios</Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">Ação Rápida</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="sr-only">Quick Action</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Label htmlFor="quick-action">Ação:</Label>
                <Input id="quick-action" {...register("quickAction", { required: true })} placeholder="Descreva a ação..." />
                <Button type="submit">Enviar</Button>
              </form>
            </DialogContent>
          </Dialog>
          {result && <div className="mt-2 text-green-600 font-medium">{result}</div>}
        </CardContent>
      </Card>
    </main>
  );
}
