// src/components/forms/budget-form/ProductionSpecificationsSection.tsx

"use client";
import React, { useEffect } from "react";
import { UseFormSetValue, UseFormWatch, FieldError, FieldErrors } from "react-hook-form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpecifications } from "@/hooks/useSpecifications";
import { useSpecificationAnalytics } from "@/lib/analytics";
import { featureFlags } from "@/lib/feature-flags";
import type { BudgetInput } from "@/lib/validation";
import type { SpecificationData } from "@/lib/specifications-enums";

type SpecificationCategory = keyof SpecificationData;
type SpecificationFieldName =
  | "cor_miolo"
  | "papel_miolo"
  | "papel_capa"
  | "cor_capa"
  | "laminacao"
  | "acabamento"
  | "shrink"
  | "centro_producao";

const SPECIFICATION_FIELD_NAMES: SpecificationFieldName[] = [
  "cor_miolo",
  "papel_miolo",
  "papel_capa",
  "cor_capa",
  "laminacao",
  "acabamento",
  "shrink",
  "centro_producao",
];

const isFieldErrorObject = (value: unknown): value is FieldError => {
  return Boolean(value) && typeof value === "object" && "message" in (value as Record<string, unknown>);
};

const resolveFieldErrorMessage = (
  fieldErrors: FieldErrors<BudgetInput>,
  fieldName: SpecificationFieldName
): string | undefined => {
  const fieldError = fieldErrors[fieldName];
  if (isFieldErrorObject(fieldError) && typeof fieldError.message === "string") {
    return fieldError.message;
  }
  return undefined;
};

interface ProductionSpecificationsSectionProps {
  setValue: UseFormSetValue<BudgetInput>;
  watch: UseFormWatch<BudgetInput>;
  errors: FieldErrors<BudgetInput>;
  specifications?: Partial<Record<SpecificationCategory, string[]>>;
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
  setValue,
  watch,
  errors,
  specifications: propSpecifications,
  disabled = false,
}) => {
  const { specifications, isLoading, getOptionsWithFallback } = useSpecifications();
  const { trackFieldUsage, trackValidationError, trackSectionCompletion } = useSpecificationAnalytics();

  // Track section completion when component unmounts
  useEffect(() => {
    const currentSpecifications: Record<SpecificationFieldName, string> = {
      cor_miolo: watch("cor_miolo") ?? "",
      papel_miolo: watch("papel_miolo") ?? "",
      papel_capa: watch("papel_capa") ?? "",
      cor_capa: watch("cor_capa") ?? "",
      laminacao: watch("laminacao") ?? "",
      acabamento: watch("acabamento") ?? "",
      shrink: watch("shrink") ?? "",
      centro_producao: watch("centro_producao") ?? "",
    };

    return () => {
      if (featureFlags.isEnabled('SPECIFICATION_ANALYTICS')) {
        trackSectionCompletion(currentSpecifications);
      }
    };
  }, [watch, trackSectionCompletion]);

  // Track validation errors
  useEffect(() => {
    if (!featureFlags.isEnabled('SPECIFICATION_ANALYTICS')) {
      return;
    }

    SPECIFICATION_FIELD_NAMES.forEach((fieldName) => {
      const message = resolveFieldErrorMessage(errors, fieldName);
      if (message) {
        trackValidationError(fieldName, message);
      }
    });
  }, [errors, trackValidationError]);

  // Prefer prop specifications if provided (SSR), else hook data
  const specs: Partial<Record<SpecificationCategory, string[]>> | undefined =
    propSpecifications ?? specifications;

  // Conditional logic: Capa selection
  const corCapaValue = watch("cor_capa");
  const isCapaDisabled = corCapaValue === "Sem capa";

  const handleFieldChange = (fieldName: SpecificationFieldName, value: string) => {
    setValue(fieldName, value, { shouldValidate: true });

    if (featureFlags.isEnabled('SPECIFICATION_ANALYTICS') && value) {
      try {
        trackFieldUsage(fieldName, value);
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

  const getOptions = (category: SpecificationCategory): string[] => {
    const providedOptions = specs?.[category];
    if (providedOptions && providedOptions.length > 0) {
      return providedOptions;
    }
    return getOptionsWithFallback(category);
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
            error={resolveFieldErrorMessage(errors, "papel_miolo")}
            placeholder="Selecione o tipo de papel"
          />
          <SpecificationField
            label="Tipo de Papel da Capa"
            name="papel_capa"
            value={watch("papel_capa")}
            options={getOptions("Tipo de Papel de Capa")}
            disabled={disabled || isCapaDisabled}
            onChange={(value) => handleFieldChange("papel_capa", value)}
            error={resolveFieldErrorMessage(errors, "papel_capa")}
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
            error={resolveFieldErrorMessage(errors, "cor_miolo")}
            placeholder="Selecione a cor do miolo"
          />
          <SpecificationField
            label="Cor da Capa"
            name="cor_capa"
            value={corCapaValue}
            options={getOptions("Cor da capa")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("cor_capa", value)}
            error={resolveFieldErrorMessage(errors, "cor_capa")}
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
            error={resolveFieldErrorMessage(errors, "laminacao")}
            placeholder="Tipo de laminação"
          />
          <SpecificationField
            label="Acabamento"
            name="acabamento"
            value={watch("acabamento")}
            options={getOptions("Tipo de acabamento")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("acabamento", value)}
            error={resolveFieldErrorMessage(errors, "acabamento")}
            placeholder="Tipo de acabamento"
          />
          <SpecificationField
            label="Shrink"
            name="shrink"
            value={watch("shrink")}
            options={getOptions("Shrink")}
            disabled={disabled}
            onChange={(value) => handleFieldChange("shrink", value)}
            error={resolveFieldErrorMessage(errors, "shrink")}
            placeholder="-"
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
            error={resolveFieldErrorMessage(errors, "centro_producao")}
            placeholder="Selecione o centro de produção"
          />
        </FormGrid>
      </div>

      {/* Conditional help text */}
      {isCapaDisabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Como &quot;Sem capa&quot; foi selecionado, 
            os campos relacionados à capa (tipo de papel e laminação) foram desabilitados.
          </p>
        </div>
      )}
    </div>
  );
};
