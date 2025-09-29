"use client";
import { useEffect, useState } from "react";
import { fetchSpecifications } from "@/lib/specifications";
import NewBudgetForm from "./form";

export default function NewBudgetPage() {
  const [specifications, setSpecifications] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpecifications = async () => {
      try {
        const specs = await fetchSpecifications();
        setSpecifications(specs);
      } catch (error) {
        console.error('Failed to load specifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSpecifications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return <NewBudgetForm specifications={specifications} />;
}
