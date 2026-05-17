export function normalizeSearchQuery(query: string) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function objectMatchesSearch(value: unknown, query: string) {
  const keywords = normalizeSearchQuery(query)
  if (keywords.length === 0) return true

  const haystack = collectSearchText(value).toLowerCase()
  return keywords.every((keyword) => haystack.includes(keyword))
}

export function filterBySearchQuery<T>(items: T[] | undefined | null, query: string) {
  const list = items || []
  if (!query.trim()) return list
  return list.filter((item) => objectMatchesSearch(item, query))
}

function collectSearchText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(collectSearchText).join(' ')
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(collectSearchText)
      .join(' ')
  }

  return ''
}
