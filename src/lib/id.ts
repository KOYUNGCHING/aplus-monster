/** Generate a stable UUID v4 */
export function uuid(): string {
  return crypto.randomUUID()
}

/** Generate a timestamp-prefixed ID for display-only ordering (not a PK) */
export function tsId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
