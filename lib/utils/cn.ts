/**
 * Utilidad para concatenar clases condicionales de Tailwind CSS.
 */

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
