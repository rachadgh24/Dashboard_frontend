/**
 * Filters a list of strings by case-insensitive query.
 * Used by SearchBar for in-memory search.
 */
export function filterByQuery(data: string[], query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return data;
  return data.filter((item) => item.toLowerCase().includes(q));
}
