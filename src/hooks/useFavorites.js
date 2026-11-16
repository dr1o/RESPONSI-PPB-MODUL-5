import { useState, useEffect, useCallback } from 'react'
import favoriteService from '../services/favoriteService'
import { getUserIdentifier } from '../services/userService'

const LOCAL_KEY = 'shelflog_favorites'
const SYNC_EVENT = 'shelflog-favorites-changed'

const readLocalFavs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeLocalFavs = (ids) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
  } catch {
    /* ignore quota errors */
  }
}

const notifyFavoritesChanged = () => {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT))
}

// ---------------------------------------------------------------------------
// useFavorites — fetches favorites from Supabase and syncs localStorage cache.
// ---------------------------------------------------------------------------
export function useFavorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLocal, setIsLocal] = useState(false)
  const userIdentifier = getUserIdentifier()

  const loadFavorites = useCallback(async (withSpinner = true) => {
    if (withSpinner) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await favoriteService.getFavorites(userIdentifier)
      if (response.success) {
        const list = response.data || []
        setFavorites(list)
        setIsLocal(false)
        writeLocalFavs(list.map((f) => f.game_id ?? f.id))
      } else {
        throw new Error(response.message)
      }
    } catch {
      setFavorites(readLocalFavs())
      setIsLocal(true)
    } finally {
      setLoading(false)
    }
  }, [userIdentifier])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) loadFavorites(false)
    })
    const onSync = () => loadFavorites(false)
    window.addEventListener(SYNC_EVENT, onSync)
    return () => {
      cancelled = true
      window.removeEventListener(SYNC_EVENT, onSync)
    }
  }, [loadFavorites])

  const refetch = useCallback(() => loadFavorites(true), [loadFavorites])

  return { favorites, loading, error, isLocal, refetch }
}

// ---------------------------------------------------------------------------
// useToggleFavorite — toggles favorite state in Supabase or localStorage.
// ---------------------------------------------------------------------------
export function useToggleFavorite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userIdentifier = getUserIdentifier()

  const toggleFavorite = async (gameId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await favoriteService.toggleFavorite({
        game_id: gameId,
        user_identifier: userIdentifier,
      })

      if (response.success) {
        notifyFavoritesChanged()
        return response.data
      }
      throw new Error(response.message)
    } catch {
      const current = readLocalFavs()
      const idx = current.findIndex((id) => String(id) === String(gameId))
      let isFavorited

      if (idx === -1) {
        current.push(gameId)
        isFavorited = true
      } else {
        current.splice(idx, 1)
        isFavorited = false
      }
      writeLocalFavs(current)
      notifyFavoritesChanged()
      return { is_favorited: isFavorited }
    } finally {
      setLoading(false)
    }
  }

  return { toggleFavorite, loading, error }
}

// ---------------------------------------------------------------------------
// useIsFavorited — convenience hook for a single game card/detail.
// ---------------------------------------------------------------------------
export function useIsFavorited(gameId) {
  const { favorites, loading: fetchLoading } = useFavorites()
  const { toggleFavorite: toggle, loading: toggleLoading } = useToggleFavorite()

  const isFavorited = favorites.some((fav) => {
    const favId =
      typeof fav === 'object' && fav !== null ? (fav.game_id ?? fav.id) : fav
    return String(favId) === String(gameId)
  })

  const toggleFavorite = async () => toggle(gameId)

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  }
}

export { getUserIdentifier }
