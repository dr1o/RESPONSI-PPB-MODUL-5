import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Trash2, Clock } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import {
  useGameLogs,
  useCreateGameLog,
  useDeleteGameLog,
} from '../../hooks/useGameLogs'
import { getUserIdentifier, getUserProfile } from '../../services/userService'
import {
  formatHours,
  averageRating,
  getStatusClass,
  getDefaultCoverForPlatform,
} from '../../utils/helpers'

/**
 * Full-screen game detail view with specs, playthrough milestones,
 * and Supabase-backed play logs / reviews.
 */
export default function GameDetail({ game, onBack, onEdit, onDelete }) {
  const fallbackCover = getDefaultCoverForPlatform(game.platform)
  const imgSrc = game.cover_url || fallbackCover
  const isLocalOnly = String(game.id).startsWith('local-')

  const { logs, loading: logsLoading, refetch: refetchLogs } = useGameLogs(game.id)
  const { createLog, loading: submitting } = useCreateGameLog()
  const { deleteLog } = useDeleteGameLog()

  const [rating, setRating] = useState(5)
  const [hoursLogged, setHoursLogged] = useState('1.5')
  const [comment, setComment] = useState('')
  const [logError, setLogError] = useState('')
  const [logSuccess, setLogSuccess] = useState('')

  const avgLogRating = averageRating(logs)
  const displayRating = Number(game.rating) || avgLogRating

  const handleSubmitLog = async (e) => {
    e.preventDefault()
    setLogError('')
    setLogSuccess('')

    if (rating < 1 || rating > 5) {
      setLogError('Rating must be between 1 and 5.')
      return
    }

    const profile = getUserProfile()
    const authorName =
      profile.username?.trim() || profile.nama?.trim() || 'Player'

    const result = await createLog(game.id, {
      user_id: getUserIdentifier(),
      author_name: authorName,
      rating,
      hours_logged: Math.max(0, Number(hoursLogged) || 0),
      comment: comment.trim(),
    })

    if (result) {
      setLogSuccess('Play log added!')
      setComment('')
      setHoursLogged('1.5')
      setRating(5)
      refetchLogs()
    } else {
      setLogError('Could not save play log. Check connection and try again.')
    }
  }

  const handleDeleteLog = async (logId) => {
    const ok = await deleteLog(logId)
    if (ok) {
      refetchLogs()
    } else {
      setLogError('Failed to remove play log.')
    }
  }

  return (
    <div className="detail">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Shelf
      </button>

      <div className="detail-hero">
        <img
          className="detail-img"
          src={imgSrc}
          alt={game.title}
          onError={(e) => {
            if (e.currentTarget.src !== window.location.origin + fallbackCover) {
              e.currentTarget.src = fallbackCover
            }
          }}
        />
        <div className="detail-info">
          <span className={getStatusClass(game.status)}>{game.status}</span>
          <h1 className="display">{game.title}</h1>
          <p className="type">
            {game.platform}
            {game.genre ? ` · ${game.genre}` : ''}
            {game.release_year ? ` · ${game.release_year}` : ''}
          </p>
          <p className="price detail-price">
            {formatHours(game.hours_played)} logged
          </p>

          {displayRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {displayRating.toFixed(1)} / 5 ({logs.length} play log
              {logs.length !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gameId={game.id ?? game.title} />
            {onEdit && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onEdit(game)}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(game)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Synopsis &amp; Overview</h2>
        <p>{game.description || 'No description added yet.'}</p>
      </section>

      {game.specs && game.specs.length > 0 && (
        <section className="detail-section">
          <h2>Game Specs</h2>
          <ul className="detail-specs">
            {game.specs.map((spec, idx) => (
              <li key={spec.id || idx}>
                <strong>{spec.name}</strong> — {spec.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {game.notes && game.notes.length > 0 && (
        <section className="detail-section">
          <h2>Playthrough Milestones</h2>
          <ol className="detail-steps">
            {game.notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="detail-section">
        <h2>Play Logs &amp; Notes</h2>

        <form className="review-form" onSubmit={handleSubmitLog}>
          <div className="form-grid">
            <div className="form-group">
              <span className="form-label">Session Rating</span>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="star-btn"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={22}
                      fill={n <= rating ? 'var(--brass)' : 'none'}
                      stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="session-hours" className="form-label">
                Session Hours
              </label>
              <input
                id="session-hours"
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={hoursLogged}
                onChange={(e) => setHoursLogged(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write session notes, boss progress, or impressions…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !game.id || isLocalOnly}
          >
            {submitting ? (
              <>
                <Loader size={16} className="spin" /> Saving…
              </>
            ) : (
              <>
                <Send size={16} /> Add Play Log
              </>
            )}
          </button>

          {logError && <p className="form-error">{logError}</p>}
          {logSuccess && <p className="form-success">{logSuccess}</p>}
          {isLocalOnly && (
            <p className="form-hint">
              Play logs require a synced Supabase game record. This item is from offline sample data.
            </p>
          )}
        </form>

        {logsLoading ? (
          <p className="detail-loading">Loading play logs…</p>
        ) : logs.length > 0 ? (
          <ul className="review-list">
            {logs.map((log) => (
              <li key={log.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">
                    {log.author_name || 'Player'}
                    {Number(log.hours_logged) > 0 && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontWeight: 500,
                          color: 'var(--steel)',
                          fontSize: '0.82rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={12} /> {formatHours(log.hours_logged)}
                      </span>
                    )}
                  </span>

                  <div className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < log.rating ? 'var(--brass)' : 'none'}
                        stroke={i < log.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                    <button
                      type="button"
                      className="btn--danger-ghost"
                      onClick={() => handleDeleteLog(log.id)}
                      title="Delete play log"
                      aria-label="Delete play log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {log.comment && <p className="review-comment">{log.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No play logs yet. Record your first session!</p>
        )}
      </section>
    </div>
  )
}
