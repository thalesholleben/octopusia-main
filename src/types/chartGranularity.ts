// Tipos para granularidade de gráficos temporais

export type GranularityType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface GranularityConfig {
  type: GranularityType;
  formatKey: string;       // Formato para chave de agrupamento
  formatLabel: string;     // Formato para exibição no X-axis
}

export interface GranularityOption {
  value: GranularityType | 'auto';
  label: string;
  shortLabel: string;      // Label curto para badge (D, S, M, T)
}

export const GRANULARITY_OPTIONS: GranularityOption[] = [
  { value: 'auto', label: 'Auto', shortLabel: 'A' },
  { value: 'daily', label: 'Diário', shortLabel: 'D' },
  { value: 'weekly', label: 'Semanal', shortLabel: 'S' },
  { value: 'monthly', label: 'Mensal', shortLabel: 'M' },
  { value: 'quarterly', label: 'Trimestral', shortLabel: 'T' },
];
