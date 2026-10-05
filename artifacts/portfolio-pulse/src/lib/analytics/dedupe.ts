/** Grouping and de-duplication helpers. Keys of `null` are never grouped together. */

export function groupBy<T, K>(items: readonly T[], key: (item: T) => K | null): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    if (k == null) continue
    const list = groups.get(k)
    if (list) list.push(item)
    else groups.set(k, [item])
  }
  return groups
}

/** Groups of two or more items that share a key. */
export function findDuplicates<T, K>(items: readonly T[], key: (item: T) => K | null): T[][] {
  return [...groupBy(items, key).values()].filter((g) => g.length > 1)
}

/**
 * Keep one item per key. When keys collide, `prefer(a, b)` picks the survivor
 * (default: the later item wins). Items with a null key are kept as-is, since
 * they can't be proven to be duplicates.
 */
export function dedupeBy<T, K>(
  items: readonly T[],
  key: (item: T) => K | null,
  prefer: (current: T, candidate: T) => T = (_current, candidate) => candidate,
): T[] {
  const kept = new Map<K, T>()
  const unkeyed: T[] = []
  for (const item of items) {
    const k = key(item)
    if (k == null) {
      unkeyed.push(item)
      continue
    }
    const existing = kept.get(k)
    kept.set(k, existing === undefined ? item : prefer(existing, item))
  }
  return [...kept.values(), ...unkeyed]
}
