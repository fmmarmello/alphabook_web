import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SpecificationData } from '@/lib/specifications-enums';

// Fallback specification data from legacy system (normalized, UTF-8)
const FALLBACK_SPECIFICATIONS: SpecificationData = {
   "Tipo de Papel miolo": [
    // Offset - Papéis básicos para impressão geral
    "Offset 75g",
    "Offset 90g", 
    "Offset 120g",    
    // Pólen - Papéis ecológicos/reciclados
    "Pólen Bold 70g",
    "Pólen Soft Natural 80g",
    "Pólen Bold 90g",    
    // Couchê - Papéis revestidos para alta qualidade
    "Couchê 90g",
    "Couchê 115g",
    "Couchê 150g",    
    // Especialidades - Papéis premium/especiais
    "Avena 70g",
    "Avena 80g"
  ],
  "Tipo de Papel de Capa": [
    "Cartão Sup. Triplex 250g",
    "Cartão Sup. Triplex 300g",
    "Couchê 150g",
    "Couchê 170g",
    "Cartão DuoDesing 300g"
  ],
  "Cor do miolo": ["4/0", "4/4", "1/0", "1/1"],
  "Cor da capa": ["4/0", "4/4", "Sem capa", "Fichário"],
  "Tipo de laminação": ["Brilho", "Fosca", "Verniz Localizado"],
  "Tipo de acabamento": [
    "Lombada colada",
    "Grampo e dobra",
    "wire-o",
    "espiral",
    "espiral + Acetato",
    "Costurado e colado",
    "Capa Dura",
    "corte reto",
    "sem acabamento"
  ],
  "Shrink": ["sim", "não"],
  "Centro de Produção": ["2Print", "Dataprint BR One", "JMV"]
};

export function useSpecifications() {
  const queryClient = useQueryClient();

  const {
    data: specifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['specifications'],
    queryFn: async (): Promise<SpecificationData> => {
      try {
        const response = await fetch('/api/specifications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data || FALLBACK_SPECIFICATIONS;
      } catch (error) {
        console.warn('Failed to fetch specifications from API, using fallback:', error);
        return FALLBACK_SPECIFICATIONS;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const getOptions = (category: keyof SpecificationData): string[] => {
    return specifications?.[category] || [];
  };

  const getOptionsWithFallback = (category: keyof SpecificationData): string[] => {
    const apiOptions = getOptions(category);
    const fallbackOptions = FALLBACK_SPECIFICATIONS[category];

    // Ensure we always have options
    return apiOptions.length > 0 ? apiOptions : fallbackOptions;
  };

  const invalidateSpecifications = () => {
    queryClient.invalidateQueries({ queryKey: ['specifications'] });
  };

  const preloadSpecifications = () => {
    queryClient.prefetchQuery({
      queryKey: ['specifications'],
      queryFn: async (): Promise<SpecificationData> => {
        try {
          const response = await fetch('/api/specifications');
          if (!response.ok) throw new Error('Failed to fetch');
          const result = await response.json();
          return result.data;
        } catch {
          return FALLBACK_SPECIFICATIONS;
        }
      },
      staleTime: 1000 * 60 * 30,
    });
  };

  return {
    specifications,
    isLoading,
    error,
    refetch,
    invalidate: invalidateSpecifications,
    preload: preloadSpecifications,
    getOptions,
    getOptionsWithFallback,
    hasData: !!specifications,
    isUsingFallback: !specifications || Object.keys(specifications).length === 0,
  };
}

// Hook for working with a specific specification category
export function useSpecificationCategory(category: keyof SpecificationData) {
  const { getOptionsWithFallback, isLoading, error } = useSpecifications();

  const options = getOptionsWithFallback(category);

  return {
    options,
    isLoading,
    error,
    hasOptions: options.length > 0,
  };
}

// Hook for managing specification field state
export function useSpecificationField(
  category: keyof SpecificationData,
  initialValue?: string,
  onChange?: (value: string) => void
) {
  const { options, isLoading, error } = useSpecificationCategory(category);
  const [value, setValue] = useState<string>(initialValue || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setIsDirty(true);
    onChange?.(newValue);
  };

  const reset = () => {
    setValue(initialValue || '');
    setIsDirty(false);
  };

  const isValid = value ? options.includes(value) : true;

  return {
    value,
    setValue,
    options,
    isLoading,
    error,
    isDirty,
    isValid,
    handleChange,
    reset,
  };
}
