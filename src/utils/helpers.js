// ---------------------------------------------------------------------------
// helpers.js — pure utility functions for ShelfLog.
// ---------------------------------------------------------------------------

export const GAME_STATUSES = ['Backlog', 'Playing', 'Completed', 'Dropped']
export const GAME_PLATFORMS = ['PC', 'PS5', 'Switch', 'Xbox', 'Mobile', 'Retro']

/**
 * Format hours played as "46.5h" or "0h".
 */
export const formatHours = (hours) => {
  const num = Number(hours)
  if (Number.isNaN(num) || num <= 0) return '0h'
  return Number.isInteger(num) ? `${num}h` : `${num.toFixed(1)}h`
}

/**
 * Return CSS class for a game status pill.
 */
export const getStatusClass = (status) => {
  const slug = String(status || 'backlog').toLowerCase()
  return `status-pill status-pill--${slug}`
}

/**
 * Client-side text search against title, genre, platform, and description.
 */
export const matchesSearch = (game, query) => {
  if (!query) return true
  const q = query.toLowerCase().trim()
  return (
    (game.title || '').toLowerCase().includes(q) ||
    (game.genre || '').toLowerCase().includes(q) ||
    (game.platform || '').toLowerCase().includes(q) ||
    (game.description || '').toLowerCase().includes(q)
  )
}

/**
 * Client-side status filter ('All' matches every status).
 */
export const matchesStatus = (game, status) => {
  if (!status || status === 'All') return true
  return (game.status || '').toLowerCase() === status.toLowerCase()
}

/**
 * Client-side platform filter ('All' matches every platform).
 */
export const matchesPlatform = (game, platform) => {
  if (!platform || platform === 'All') return true
  return (game.platform || '').toLowerCase() === platform.toLowerCase()
}

/**
 * Sort an array of games by key and direction.
 * @param {'title'|'hours_played'|'rating'|'release_year'|'created_at'} key
 * @param {'asc'|'desc'} order
 */
export const sortGames = (games, key = 'created_at', order = 'desc') => {
  const sorted = [...games].sort((a, b) => {
    if (key === 'hours_played' || key === 'rating' || key === 'release_year') {
      return (Number(a[key]) || 0) - (Number(b[key]) || 0)
    }
    if (key === 'created_at') {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    }
    return String(a[key] || '').localeCompare(String(b[key] || ''))
  })
  return order === 'desc' ? sorted.reverse() : sorted
}

/**
 * Truncate text to `max` characters.
 */
export const truncate = (str, max = 90) => {
  if (!str || str.length <= max) return str || ''
  return str.slice(0, max).trimEnd() + '…'
}

/**
 * Extract unique platform options from a list of games.
 */
export const extractPlatforms = (games) => {
  const set = new Set()
  games.forEach((g) => {
    if (g.platform) set.add(g.platform)
  })
  return ['All', ...Array.from(set).sort()]
}

/**
 * Compute average rating from play logs (0 when empty).
 */
export const averageRating = (logs) => {
  if (!logs || logs.length === 0) return 0
  const sum = logs.reduce((acc, log) => acc + (Number(log.rating) || 0), 0)
  return Math.round((sum / logs.length) * 10) / 10
}

/**
 * Resolve default SVG cover preset for a given platform.
 */
export const getDefaultCoverForPlatform = (platform) => {
  const p = String(platform || '').toLowerCase()
  if (p === 'ps5' || p === 'xbox') return '/covers/console.svg'
  if (p === 'switch' || p === 'mobile') return '/covers/handheld.svg'
  if (p === 'retro') return '/covers/retro.svg'
  return '/covers/pc.svg'
}
