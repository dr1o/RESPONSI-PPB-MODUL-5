import { useMemo } from 'react'
import { Heart, Loader, AlertCircle, ArrowRight } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useGames } from '../hooks/useGames'
import GAMES_LOCAL from '../data/games'
import GameCard from '../components/game/GameCard'

/**
 * FavoritesPage — Displays user's pinned/favorited games from Supabase
 * with offline localStorage fallback resolution.
 */
export default function FavoritesPage({
  onSelectGame,
  onEditGame,
  onDeleteGame,
  onNavigateShelf,
}) {
  const { favorites, loading: favLoading, error: favError, isLocal, refetch } =
    useFavorites()
  const { games: knownGames } = useGames({ limit: 100 })

  const gameLookup = useMemo(() => {
    const map = new Map()
    GAMES_LOCAL.forEach((g) => {
      map.set(g.id, g)
      map.set(String(g.id), g)
    })
    knownGames.forEach((g) => {
      if (g.id !== undefined && g.id !== null) {
        map.set(g.id, g)
        map.set(String(g.id), g)
      }
    })
    return map
  }, [knownGames])

  const favoriteItems = useMemo(() => {
    const resolved = []
    const seen = new Set()

    favorites.forEach((fav) => {
      const id = typeof fav === 'object' && fav !== null ? fav.game_id ?? fav.id : fav
      const key = String(id)
      if (!id || seen.has(key)) return

      const match =
        gameLookup.get(id) ||
        gameLookup.get(key) ||
        (typeof fav === 'object' && fav?.title ? fav : null)

      if (match) {
        seen.add(key)
        resolved.push(match)
      }
    })

    return resolved
  }, [favorites, gameLookup])

  const isLoading = favLoading && favoriteItems.length === 0

  return (
    <div className="fav-page">
      <section className="masthead">
        <h1 className="display">Saved Shortlist</h1>
        <p className="lede">
          Games pinned for your next playthrough or all-time favorites. Synced
          with Supabase and cached offline.
        </p>
      </section>

      <section className="fav-content">
        <div className="list-head">
          <h2>Pinned Games</h2>
          <span className="count">
            {favoriteItems.length} game{favoriteItems.length !== 1 ? 's' : ''} saved
          </span>
        </div>

        {isLoading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading your shortlist…</p>
          </div>
        )}

        {!isLoading && favError && favoriteItems.length === 0 && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{favError}</p>
            <button type="button" className="btn btn--outline" onClick={refetch}>
              Retry Connection
            </button>
          </div>
        )}

        {!isLoading && favoriteItems.length === 0 && !favError && (
          <div className="state-box">
            <Heart size={36} stroke="var(--steel)" />
            <h3>No games favorited yet</h3>
            <p className="lede">
              Explore your shelf and tap the heart button on any game to save it
              here.
            </p>
            {onNavigateShelf && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateShelf}
                style={{ marginTop: '12px' }}
              >
                Browse Shelf <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {favoriteItems.length > 0 && (
          <ul className="stock">
            {favoriteItems.map((game) => (
              <GameCard
                key={game.id ?? game.title}
                game={game}
                onSelect={onSelectGame}
                onEdit={onEditGame}
                onDelete={
                  String(game.id).startsWith('local-') ? undefined : onDeleteGame
                }
              />
            ))}
          </ul>
        )}

        {isLocal && favoriteItems.length > 0 && (
          <p className="local-notice">
            Using offline favorites cache.{' '}
            <button type="button" className="link-btn" onClick={refetch}>
              Retry sync
            </button>
          </p>
        )}
      </section>
    </div>
  )
}
