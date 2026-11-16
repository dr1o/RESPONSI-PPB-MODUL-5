import { useState, useMemo } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
} from 'lucide-react'
import { useGames } from '../hooks/useGames'
import GameCard from '../components/game/GameCard'
import GameDetail from '../components/game/GameDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gameService from '../services/gameService'
import {
  matchesSearch,
  matchesStatus,
  matchesPlatform,
  sortGames,
  extractPlatforms,
  formatHours,
} from '../utils/helpers'

/**
 * ShelfPage — Main video game library with summary metrics, filtering,
 * offline read-through caching, and delete confirmation.
 */
export default function ShelfPage({ onNavigate }) {
  const { games: rawGames, loading, error, isOfflineCache, refetch } = useGames({
    limit: 100,
  })

  // Filters & sort
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [activePlatform, setActivePlatform] = useState('All')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Local fallback detail view if used standalone
  const [localSelected, setLocalSelected] = useState(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const platforms = useMemo(() => extractPlatforms(rawGames), [rawGames])

  const summary = useMemo(() => {
    const total = rawGames.length
    const playing = rawGames.filter((g) => g.status === 'Playing').length
    const completed = rawGames.filter((g) => g.status === 'Completed').length
    const totalHours = rawGames.reduce(
      (sum, g) => sum + (Number(g.hours_played) || 0),
      0,
    )
    return { total, playing, completed, totalHours }
  }, [rawGames])

  const filteredGames = useMemo(() => {
    const filtered = rawGames.filter(
      (g) =>
        matchesSearch(g, search) &&
        matchesStatus(g, activeStatus) &&
        matchesPlatform(g, activePlatform),
    )
    return sortGames(filtered, sortKey, sortOrder)
  }, [rawGames, search, activeStatus, activePlatform, sortKey, sortOrder])

  const handleSelectGame = (game) => {
    if (onNavigate) {
      onNavigate('Detail', game)
    } else {
      setLocalSelected(game)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await gameService.deleteGame(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete game.')
    } finally {
      setDeleting(false)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setActiveStatus('All')
    setActivePlatform('All')
  }

  if (localSelected) {
    return (
      <GameDetail
        game={localSelected}
        onBack={() => setLocalSelected(null)}
        onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
        onDelete={(g) => {
          setLocalSelected(null)
          setDeleteTarget(g)
        }}
      />
    )
  }

  return (
    <>
      <section className="masthead">
        <h1 className="display">Your game shelf, logged by play.</h1>
        <p className="lede">
          A personal catalog of backlog titles, active playthroughs, hours logged,
          and completed runs — synced with Supabase and available offline.
        </p>

        <div className="shelf-summary">
          <div className="summary-tile">
            <span className="summary-val display">{summary.total}</span>
            <span className="summary-label">Total Games</span>
          </div>
          <div className="summary-tile">
            <span className="summary-val display">{summary.playing}</span>
            <span className="summary-label">Playing</span>
          </div>
          <div className="summary-tile">
            <span className="summary-val display">{summary.completed}</span>
            <span className="summary-label">Completed</span>
          </div>
          <div className="summary-tile">
            <span className="summary-val display">
              {formatHours(summary.totalHours)}
            </span>
            <span className="summary-label">Total Hours</span>
          </div>
        </div>
      </section>

      <section>
        <div className="list-head">
          <h2>Logged library</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          activeStatus={activeStatus}
          onStatus={setActiveStatus}
          platforms={platforms}
          activePlatform={activePlatform}
          onPlatform={setActivePlatform}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
          }}
        />

        {loading && rawGames.length === 0 && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading your game shelf…</p>
          </div>
        )}

        {!loading && error && rawGames.length === 0 && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGames.length === 0 && rawGames.length > 0 && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No games match your current search or filter.</p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}

        {!loading && rawGames.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>Your game shelf is empty. Log your first game to get started!</p>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Log Game
              </button>
            )}
          </div>
        )}

        {filteredGames.length > 0 && (
          <ul className="stock">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id ?? game.title}
                game={game}
                onSelect={handleSelectGame}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={
                  String(game.id).startsWith('local-') ? undefined : setDeleteTarget
                }
              />
            ))}
          </ul>
        )}

        {isOfflineCache && (
          <p className="local-notice">
            Showing cached offline shelf (Supabase unreachable).{' '}
            <button type="button" className="link-btn" onClick={refetch}>
              Retry sync
            </button>
          </p>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Game Entry"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from your shelf? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError('')
        }}
      />

      {deleteError && <div className="toast toast--error">{deleteError}</div>}
    </>
  )
}
