// src/components/forms/budget-form/ProductionSpecificationsSection.tsx

"use client";
import React, { useEffect } from "react";
import { Control, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpecifications } from "@/hooks/useSpecifications";
import { useSpecificationAnalytics, ErrorTracker } from "@/lib/analytics";
import { featureFlags } from "@/lib/feature-flags";
import type { BudgetInput } from "@/lib/validation";

interface ProductionSpecificationsSectionProps {
  control: Control<BudgetInput>;
  setValue: UseFormSetValue<BudgetInput>;
  watch: UseFormWatch<BudgetInput>;
  errors: FieldErrors<BudgetInput>;
  specifications?: Record<string, string[]>;
  initialData?: Partial<BudgetInput>;
  disabled?: boolean;
}

// Helper component for a single specification field
const SpecificationField: React.FC<{
  label: string;
  name: keyof BudgetInput;
  value?: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}> = ({ label, name, value, options, disabled, onChange, error, placeholder }) => {
  const hasOptions = options && options.length > 0;
  
  return (
    <FormField>
      <Label htmlFor={name}>{label}</Label>
      {hasOptions ? (
        <Select
          value={value || "all"}  // ✅ Use empty string as fallback
          onValueChange={(selectedValue) => {
            // ✅ Convert 'all' string selection back to empty for clearing
            onChange(selectedValue === "all" ? "" : selectedValue);
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder || "Selecione..."} />
          </SelectTrigger>
          <SelectContent>
            {/* ✅ First option for clearing - use meaningful value */}
            <SelectItem value="all">
              {placeholder || "Selecione..."}
            </SelectItem>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={error ? "border-red-500" : ""}
          data-testid={name}
        />
      )}
      {error && (
        <span className="text-sm text-red-500">
          {error}
        </span>
      )}
    </FormField>
  );
};

export const ProductionSpecificationsSection: React.FC<ProductionSpecificationsSectionProps> = ({
  control,
  setValue,
  watch,
  errors,
  specifications: propSpecifications,
  initialData,
  disabled = false,
}) => {
  const { specifications, isLoading, getOptionsWithFallback } = useSpecifications();
  const { trackFieldUsage, trackValidationError, trackSectionCompletion } = useSpecificationAnalytics();

  // Track section completion when component unmounts
  useEffect(() => {
    const currentSpecifications = {
      cor_miolo: watch("cor_miolo"),
      papel_miolo: watch("papel_miolo"),
      papel_capa: watch("papel_capa"),
      cor_capa: watch("cor_capa"),
      laminacao: watch("laminacao"),
      acabamento: watch("acabamento"),
      shrink: watch("shrink"),
      centro_producao: watch("centro_producao"),
    };

    return () => {
      if (featureFlags.isEnabled('SPECIFICATION_ANALYTICS')) {
        trackSectionCompletion(currentSpecifications as any);
      }
    };
  }, [watch, trackSectionCompletion]);

  // Track validation errors
  useEffect(() => {
    if (featureFlags.isEnabled('SPECIFICATION_ANALYTICS')) {
      Object.entries(errors).forEach(([fieldName, error]) => {
        if (error && isSpecificationField(fieldName)) {
          trackValidationError(fieldName, (error as any).message || 'Unknown validation error');
        }
      });
    }
  }, [errors, trackValidationError]);

  const isSpecificationField = (fieldName: string): boolean => {
    const specificationFields = [
      'cor_miolo', 'papel_miolo', 'papel_capa', 'cor_capa', 'laminacao', 'acabamento', 'shrink', 'centro_producao'
    ];
    return specificationFields.includes(fieldName);
  };

  // Prefer prop specifications if provided (SSR), else hook data
  const specs = propSpecifications || specifications;

  // Conditional logic: Capa selection
  const corCapaValue = watch("cor_capa");
  const isCapaDisabled = corCapaValue === "Sem capa";

  const handleFieldChange = (fieldName: keyof BudgetInput, value: string) => {
    setValue(fieldName, value as any, { shouldValidate: true });

    if (featureFlags.isEnabled('SPECIFICATION_ANALYTICS') && value) {
      try {
        trackFieldUsage(fieldName as string, value);
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    }

    // ✅ Clear related fields when "Sem capa" is selected
    if (fieldName === 'cor_capa' && value === 'Sem capa') {
      setValue('papel_capa', "");
      setValue('laminacao', "");
    }
  };

  const getOptions = (category: string): string[] => {
    if (specs && (specs as any)[category]) {
      return (specs as any)[category];
    }
    return getOptionsWithFallback(category as any);
  };

  if (isLoading && !specs) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className=" pb-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Especificações de Produção
        </h3>
        {/* <p className="text-sm text-gray-600 mt-2">
          Detalhes técnicos para produção do material
        </p> */}
      </div>

      {/* Row 1: Paper Types */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 border-b pb-1">
          Tipos de Papel
        </h4>
        <FormGrid columns={2} gap="md">
          <SpecificationField
            label="Tipo de Papel do Miolo"
            name="papel_miolo"
            value={watch("papel_miolo")}
            options={getOptions("Tipo de Papel miolo")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("papel_miolo", value)}
            error={(errors as any).papel_miolo?.message}
            placeholder="Selecione o tipo de papel"
          />
          <SpecificationField
            label="Tipo de Papel da Capa"
            name="papel_capa"
            value={watch("papel_capa")}
            options={getOptions("Tipo de Papel de Capa")}
            disabled={disabled || isCapaDisabled}
            onChange={(value) => handleFieldChange("papel_capa", value)}
            error={(errors as any).papel_capa?.message}
            placeholder="Selecione o tipo de papel da capa"
          />
        </FormGrid>
      </div>

      {/* Row 2: Colors */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 border-b pb-1">
          Cores
        </h4>
        <FormGrid columns={2} gap="md">
          <SpecificationField
            label="Cor do Miolo"
            name="cor_miolo"
            value={watch("cor_miolo")}
            options={getOptions("Cor do miolo")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("cor_miolo", value)}
            error={(errors as any).cor_miolo?.message}
            placeholder="Selecione a cor do miolo"
          />
          <SpecificationField
            label="Cor da Capa"
            name="cor_capa"
            value={corCapaValue}
            options={getOptions("Cor da capa")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("cor_capa", value)}
            error={(errors as any).cor_capa?.message}
            placeholder="Selecione a cor da capa"
          />
        </FormGrid>
      </div>

      {/* Row 3: Finishing */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 border-b pb-1">
          Acabamento
        </h4>
        <FormGrid columns={3} gap="md">
          <SpecificationField
            label="Laminação"
            name="laminacao"
            value={watch("laminacao")}
            options={getOptions("Tipo de laminação")}
            disabled={disabled || isCapaDisabled}
            onChange={(value) => handleFieldChange("laminacao", value)}
            error={(errors as any).laminacao?.message}
            placeholder="Tipo de laminação"
          />
          <SpecificationField
            label="Acabamento"
            name="acabamento"
            value={watch("acabamento")}
            options={getOptions("Tipo de acabamento")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("acabamento", value)}
            error={(errors as any).acabamento?.message}
            placeholder="Tipo de acabamento"
          />
          <SpecificationField
            label="Shrink"
            name="shrink"
            value={watch("shrink")}
            options={getOptions("Shrink")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("shrink", value)}
            error={(errors as any).shrink?.message}
            placeholder="Embalagem shrink"
          />
        </FormGrid>
      </div>

      {/* Row 4: Production Center */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 border-b pb-1">
          Produção
        </h4>
        <FormGrid columns={1} gap="md">
          <SpecificationField
            label="Centro de Produção"
            name="centro_producao"
            value={watch("centro_producao")}
            options={getOptions("Centro de Produção")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("centro_producao", value)}
            error={(errors as any).centro_producao?.message}
            placeholder="Selecione o centro de produção"
          />
        </FormGrid>
      </div>

      {/* Conditional help text */}
      {isCapaDisabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Como "Sem capa" foi selecionado, 
            os campos relacionados à capa (tipo de papel e laminação) foram desabilitados.
          </p>
        </div>
      )}
    </div>
  );
};
