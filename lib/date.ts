export function getCurrentMonthRange(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);

  return { start, end };
}

export function formatMonthLabel(date: Date = new Date(), locale: string | string[] = 'ja-JP') {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date);
}
