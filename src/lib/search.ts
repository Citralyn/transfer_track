export function normalizeSearchQuery(query: string) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function encodeSearchSlug(query: string) {
  return encodeURIComponent(
    query
      .trim()
      .replace(/\s+/g, '-')
  )
}

export function decodeSearchSlug(slug?: string) {
  if (!slug) return ''
  return decodeURIComponent(slug).replace(/-/g, ' ').trim()
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

export type SearchField<T> = {
  path: string
  weight?: number
  getValue?: (item: T) => unknown
}

export type SearchMatchMode = 'includes' | 'word-start'

export function rankBySearchQuery<T>(
  items: T[] | undefined | null,
  query: string,
  fields: SearchField<T>[] = [],
  searchPaths?: string[],
  matchMode: SearchMatchMode = 'includes'
) {
  const list = items || []
  const keywords = normalizeSearchQuery(query)
  if (keywords.length === 0) return list

  return list
    .map((item, index) => ({
      item,
      index,
      score: scoreSearchResult(item, keywords, fields, searchPaths, matchMode),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((result) => result.item)
}

function scoreSearchResult<T>(
  item: T,
  keywords: string[],
  fields: SearchField<T>[],
  searchPaths?: string[],
  matchMode: SearchMatchMode = 'includes'
) {
  const fullText = collectSearchText(
    searchPaths?.length
      ? searchPaths.map((path) => getValueAtPath(item, path))
      : item
  ).toLowerCase()
  if (!textMatchesKeywords(fullText, keywords, matchMode)) return 0

  let score = 1

  fields.forEach((field) => {
    const value = field.getValue ? field.getValue(item) : getValueAtPath(item, field.path)
    const text = collectSearchText(value).toLowerCase()
    if (!text) return

    const weight = field.weight ?? 1
    keywords.forEach((keyword) => {
      if (text === keyword) score += weight * 16
      else if (text.startsWith(keyword)) score += weight * 10
      else if (text.split(/\s+/).some((word) => word.startsWith(keyword))) score += weight * 7
      else if (text.includes(keyword)) score += weight * 4
    })
  })

  keywords.forEach((keyword) => {
    const occurrences = fullText.split(keyword).length - 1
    score += Math.min(occurrences, 8)
  })

  return score
}

function textMatchesKeywords(text: string, keywords: string[], matchMode: SearchMatchMode) {
  if (matchMode === 'includes') {
    return keywords.every((keyword) => text.includes(keyword))
  }

  const words = text.split(/[^a-z0-9]+/).filter(Boolean)
  return keywords.every((keyword) => words.some((word) => word.startsWith(keyword)))
}

function getValueAtPath(value: unknown, path: string): unknown {
  if (!path) return value

  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined
    if (Array.isArray(current)) return current.map((item) => getValueAtPath(item, key))
    if (typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, value)
}

export function collectSearchText(value: unknown): string {
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
