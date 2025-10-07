// Specification enums for budget production fields
// Based on legacy system specifications from ED/especificacoes.json

export const SPECIFICATION_OPTIONS = {
  COR_MIOLO: ["4/0", "4/4", "1/0", "1/1"] as const,
  PAPEL_MIOLO: [
    "offset 75g",
    "offset 90g",
    "pólen Soft Nat 80g",
    "pólen Bold 90g",
    "pólen Bold 70g",
    "couchê 90g",
    "couchê 115g",
    "couchê 150g",
    "Avena 70g",
    "Avena 80g",
    "off set 120g"
  ] as const,
  PAPEL_CAPA: [
    "Cartão Sup. Triplex 250g",
    "Cartão Sup. Triplex 300g",
    "Couchê 150g",
    "Couchê 170g",
    "Cartão DuoDesing 300g"
  ] as const,
  COR_CAPA: ["4/0", "4/4", "Sem capa", "Fichário"] as const,
  LAMINACAO: ["Brilho", "Fosca", "Verniz Localizado"] as const,
  ACABAMENTO: [
    "Lombada colada",
    "Grampo e dobra",
    "wire-o",
    "espiral",
    "espiral + Acetato",
    "Costurado e colado",
    "Capa Dura",
    "corte reto",
    "sem acabamento"
  ] as const,
  SHRINK: ["sim", "não"] as const,
  CENTRO_PRODUCAO: ["2Print", "Dataprint BR One", "JMV"] as const,
} as const;

// Type exports for use throughout the application
export type CorMioloOption = typeof SPECIFICATION_OPTIONS.COR_MIOLO[number];
export type PapelMioloOption = typeof SPECIFICATION_OPTIONS.PAPEL_MIOLO[number];
export type PapelCapaOption = typeof SPECIFICATION_OPTIONS.PAPEL_CAPA[number];
export type CorCapaOption = typeof SPECIFICATION_OPTIONS.COR_CAPA[number];
export type LaminacaoOption = typeof SPECIFICATION_OPTIONS.LAMINACAO[number];
export type AcabamentoOption = typeof SPECIFICATION_OPTIONS.ACABAMENTO[number];
export type ShrinkOption = typeof SPECIFICATION_OPTIONS.SHRINK[number];
export type CentroProducaoOption = typeof SPECIFICATION_OPTIONS.CENTRO_PRODUCAO[number];

// Interface for specification data structure
export interface SpecificationData {
  "Tipo de Papel miolo": string[];
  "Tipo de Papel de Capa": string[];
  "Cor do miolo": string[];
  "Cor da capa": string[];
  "Tipo de laminação": string[];
  "Tipo de acabamento": string[];
  "Shrink": string[];
  "Centro de Produção": string[];
}

// Helper function to get display name for specification categories
export const getSpecificationDisplayName = (category: keyof SpecificationData): string => {
  const displayNames: Record<keyof SpecificationData, string> = {
    "Tipo de Papel miolo": "Tipo de Papel do Miolo",
    "Tipo de Papel de Capa": "Tipo de Papel da Capa",
    "Cor do miolo": "Cor do Miolo",
    "Cor da capa": "Cor da Capa",
    "Tipo de laminação": "Laminação",
    "Tipo de acabamento": "Acabamento",
    "Shrink": "Shrink",
    "Centro de Produção": "Centro de Produção"
  };
  return displayNames[category] || category;
};

// Helper function to get field name from category
export const getFieldName = (category: keyof SpecificationData): string => {
  const fieldMapping: Record<keyof SpecificationData, string> = {
    "Tipo de Papel miolo": "papel_miolo",
    "Tipo de Papel de Capa": "papel_capa",
    "Cor do miolo": "cor_miolo",
    "Cor da capa": "cor_capa",
    "Tipo de laminação": "laminacao",
    "Tipo de acabamento": "acabamento",
    "Shrink": "shrink",
    "Centro de Produção": "centro_producao"
  };
  return fieldMapping[category];
};

// Helper function to validate specification value
export const isValidSpecificationValue = (
  category: keyof SpecificationData,
  value: string
): boolean => {
  return (
    SPECIFICATION_OPTIONS[
      getFieldName(category).toUpperCase() as keyof typeof SPECIFICATION_OPTIONS
    ]?.includes(value as any) || false
  );
};

