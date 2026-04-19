/**
 * Quota — Formateo de moneda
 * Soporta ARS, USD, UYU con separadores locales.
 */

const LOCALES = {
  ARS: 'es-AR',
  USD: 'en-US',
  UYU: 'es-UY',
}

/**
 * Formatea un número como moneda.
 * @param {number} value
 * @param {string} currency - 'ARS' | 'USD' | 'UYU'
 * @returns {string}  e.g. "$ 120.000,00"
 */
export function formatCurrency(value, currency = 'ARS') {
  const locale = LOCALES[currency] ?? 'es-AR'
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
