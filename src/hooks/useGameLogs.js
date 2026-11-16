import { useState, useEffect, useCallback } from 'react'
import logService from '../services/logService'

const logsCacheKey = (gameId) => `shelflog_logs_${gameId}`

const readCachedLogs = (gameId) => {
  try {
    const raw = localStorage.getItem(logsCacheKey(gameId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeCachedLogs = (gameId, logs) => {
  try {
    localStorage.setItem(logsCacheKey(gameId), JSON.stringify(logs))
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// useGameLogs — fetch play session logs / reviews for a specific game.
// ---------------------------------------------------------------------------
export function useGameLogs(gameId) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(Boolean(gameId))
  const [error, setError] = useState(null)

  const loadLogs = useCallback(async (withSpinner = true) => {
    if (!gameId) {
      setLogs([])
      setLoading(false)
      return
    }
    if (withSpinner) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await logService.getLogs(gameId)
      if (response.success) {
        const list = response.data || []
        setLogs(list)
        setError(null)
        writeCachedLogs(gameId, list)
      } else {
        throw new Error(response.message || 'Failed to fetch play logs.')
      }
    } catch (err) {
      const cached = readCachedLogs(gameId)
      setLogs(cached)
      if (cached.length === 0) {
        setError(err.message || 'Unable to load play logs.')
      }
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) loadLogs(false)
    })
    return () => {
      cancelled = true
    }
  }, [loadLogs])

  const refetch = useCallback(() => loadLogs(true), [loadLogs])

  return { logs, loading, error, refetch }
}

// ---------------------------------------------------------------------------
// useCreateGameLog — submit a new session log / review.
// ---------------------------------------------------------------------------
export function useCreateGameLog() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createLog = async (gameId, logData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await logService.createLog(gameId, logData)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to submit play log.')
    } catch (err) {
      setError(err.message || 'Error submitting play log.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createLog, loading, error }
}

// ---------------------------------------------------------------------------
// useDeleteGameLog — delete a session log / review.
// ---------------------------------------------------------------------------
export function useDeleteGameLog() {
  const [loading, setLoading] = useState(false)

  const deleteLog = async (logId) => {
    try {
      setLoading(true)
      await logService.deleteLog(logId)
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deleteLog, loading }
}
