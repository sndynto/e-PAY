/** Format a number as Indonesian Rupiah */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format a USDC amount (6 decimals) to display string */
export function formatUSDC(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount)
}

/** Shorten a wallet address for display */
export function shortAddress(addr: string): string {
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Shorten a tx hash for display */
export function shortHash(hash: string): string {
  if (hash.length < 12) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

/** Format a timestamp to a human-readable date/time */
export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

/** Format a timestamp to relative time */
export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}
