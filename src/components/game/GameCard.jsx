import { Star, Pencil, Trash2 } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import {
  formatHours,
  getStatusClass,
  getDefaultCoverForPlatform,
  truncate,
} from '../../utils/helpers'

/**
 * Game card used in ShelfPage and FavoritesPage grids.
 */
export default function GameCard({ game, onSelect, onEdit, onDelete }) {
  const fallbackCover = getDefaultCoverForPlatform(game.platform)
  const imgSrc = game.cover_url || fallbackCover

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(game)}
        aria-label={`View ${game.title}`}
      >
        <img
          className="card-img"
          src={imgSrc}
          alt={game.title}
          width="240"
          height="180"
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src !== window.location.origin + fallbackCover) {
              e.currentTarget.src = fallbackCover
            }
          }}
        />

        <div className="card-status-wrap">
          <span className={getStatusClass(game.status)}>{game.status}</span>
        </div>

        <span className="name display">{game.title}</span>

        <span className="type">
          {game.platform}
          {game.genre ? ` · ${game.genre}` : ''}
          {game.release_year ? ` · ${game.release_year}` : ''}
        </span>

        {game.description && (
          <span className="card-desc">{truncate(game.description, 76)}</span>
        )}

        <div className="card-meta-row">
          <span className="price">{formatHours(game.hours_played)} logged</span>
          {Number(game.rating) > 0 && (
            <span className="card-rating">
              <Star size={14} fill="var(--brass)" stroke="var(--brass)" />
              {game.rating}/5
            </span>
          )}
        </div>
      </button>

      <div className="card-actions">
        <FavoriteButton gameId={game.id ?? game.title} />

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(game)
            }}
            aria-label={`Edit ${game.title}`}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(game)
            }}
            aria-label={`Delete ${game.title}`}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  )
}
