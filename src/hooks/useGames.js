import { useState, useEffect, useCallback } from 'react'
import gameService from '../services/gameService'
import GAMES_LOCAL from '../data/games'

const CACHE_KEY = 'shelflog_games_cache'

export const readCachedGames = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export const writeCachedGames = (games) => {
  try {
    if (Array.isArray(games)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(games))
    }
  } catch {
    /* ignore storage quota errors */
  }
}

export const clearCachedGames = () => {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// useGames — fetches games from Supabase with automatic localStorage cache
// read-through for true offline resilience.
// ---------------------------------------------------------------------------
export function useGames(params = {}) {
  const [games, setGames] = useState(() => readCachedGames() || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOfflineCache, setIsOfflineCache] = useState(false)

  const paramKey = JSON.stringify(params)

  const loadGames = useCallback(async (withSpinner = true) => {
    if (withSpinner) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await gameService.getGames(params)
      if (response.success) {
        const list = response.data || []
        setGames(list)
        setError(null)
        setIsOfflineCache(false)
        if (!params.search && !params.status && !params.platform) {
          writeCachedGames(list)
        }
      } else {
        throw new Error(response.message || 'Failed to load shelf.')
      }
    } catch (err) {
      const cached = readCachedGames()
      if (cached) {
        setGames(cached)
        setIsOfflineCache(true)
        setError(null)
      } else {
        setGames(GAMES_LOCAL)
        setIsOfflineCache(true)
        setError(err.message || 'Server unavailable. Showing offline sample shelf.')
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) loadGames(false)
    })
    return () => {
      cancelled = true
    }
  }, [loadGames])

  const refetch = useCallback(() => loadGames(true), [loadGames])

  return { games, loading, error, isOfflineCache, refetch }
}

// ---------------------------------------------------------------------------
// useGameById — fetch single game by ID with offline cache fallback.
// ---------------------------------------------------------------------------
export function useGameById(id) {
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)

  const loadGame = useCallback(async (withSpinner = true) => {
    if (!id) {
      setGame(null)
      setLoading(false)
      return
    }
    if (withSpinner) {
      setLoading(true)
      setError(null)
    }

    try {
      if (String(id).startsWith('local-')) {
        const localMatch = GAMES_LOCAL.find((g) => String(g.id) === String(id))
        if (localMatch) {
          setGame(localMatch)
          setError(null)
          return
        }
      }

      const response = await gameService.getGameById(id)
      if (response.success) {
        setGame(response.data)
        setError(null)
      } else {
        throw new Error(response.message || 'Game not found.')
      }
    } catch (err) {
      const pool = [...(readCachedGames() || []), ...GAMES_LOCAL]
      const fallback = pool.find((g) => String(g.id) === String(id))
      if (fallback) {
        setGame(fallback)
        setError(null)
      } else {
        setGame(null)
        setError(err.message || 'Failed to load game details.')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) loadGame(false)
    })
    return () => {
      cancelled = true
    }
  }, [loadGame])

  const refetch = useCallback(() => loadGame(true), [loadGame])

  return { game, loading, error, refetch }
}
