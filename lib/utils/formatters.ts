/**
 * Funciones auxiliares de formateo para el sistema de bodega.
 * Formateo de moneda local, porcentajes y fechas en español.
 */

/**
 * Formatea un número como moneda (S/ o $)
 */
export function formatCurrency(amount: number, currency = "S/"): string {
  return `${currency} ${amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Formatea una fecha ISO a formato local legible
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatea fecha y hora completa
 */
export function formatDateTime(isoDate: string): string {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
