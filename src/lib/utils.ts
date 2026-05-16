export function parseListInput(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

export function hasMatch(source: string[], target: string) {
  const normalizedTarget = normalizeText(target)
  return source.some((item) => normalizeText(item) === normalizedTarget)
}

export function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
