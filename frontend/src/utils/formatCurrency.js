const LOCALES = {
  ARS: 'es-AR',
  USD: 'es-AR',
  UYU: 'es-UY',
}

const SYMBOLS = {
  ARS: '$',
  USD: 'U$S',
  UYU: '$U',
}

export function formatCurrency(value, currency = 'ARS') {
  const locale  = LOCALES[currency]  ?? 'es-AR'
  const symbol  = SYMBOLS[currency]  ?? currency
  const number  = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
  return `${symbol} ${number}`
}
