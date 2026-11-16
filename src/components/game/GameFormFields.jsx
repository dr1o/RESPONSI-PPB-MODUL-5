import { Plus, X, Star, Loader, Save } from 'lucide-react'
import { GAME_PLATFORMS, GAME_STATUSES } from '../../utils/helpers'

/**
 * Shared game metadata, specs, and playthrough milestones form fields
 * used by both CreateGamePage and EditGamePage.
 */
export default function GameFormFields({
  formData,
  onFormChange,
  onRatingChange,
  specs,
  onSpecChange,
  onAddSpec,
  onRemoveSpec,
  notes,
  onNoteChange,
  onAddNote,
  onRemoveNote,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save Game',
  submittingLabel = 'Saving…',
}) {
  return (
    <form onSubmit={onSubmit} className="entry-form">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="game-title" className="form-label">
            Game Title <span className="req">*</span>
          </label>
          <input
            id="game-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={onFormChange}
            placeholder="e.g. Hollow Knight, Persona 5 Royal…"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="game-genre" className="form-label">
            Genre <span className="req">*</span>
          </label>
          <input
            id="game-genre"
            type="text"
            name="genre"
            value={formData.genre}
            onChange={onFormChange}
            placeholder="e.g. Action RPG, Metroidvania, JRPG…"
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-grid form-grid--3">
        <div className="form-group">
          <label htmlFor="game-platform" className="form-label">
            Platform <span className="req">*</span>
          </label>
          <select
            id="game-platform"
            name="platform"
            value={formData.platform}
            onChange={onFormChange}
            className="form-select"
          >
            {GAME_PLATFORMS.map((plat) => (
              <option key={plat} value={plat}>
                {plat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="game-status" className="form-label">
            Play Status <span className="req">*</span>
          </label>
          <select
            id="game-status"
            name="status"
            value={formData.status}
            onChange={onFormChange}
            className="form-select"
          >
            {GAME_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="game-year" className="form-label">
            Release Year
          </label>
          <input
            id="game-year"
            type="number"
            name="release_year"
            min="1970"
            max="2035"
            value={formData.release_year}
            onChange={onFormChange}
            placeholder="e.g. 2022"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="game-hours" className="form-label">
            Hours Played
          </label>
          <input
            id="game-hours"
            type="number"
            name="hours_played"
            min="0"
            max="9999"
            step="0.5"
            value={formData.hours_played}
            onChange={onFormChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <span className="form-label">Personal Rating</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '42px' }}>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="star-btn"
                  onClick={() => onRatingChange(n)}
                  aria-label={`Rate ${n} out of 5`}
                >
                  <Star
                    size={22}
                    fill={n <= Number(formData.rating) ? 'var(--brass)' : 'none'}
                    stroke={n <= Number(formData.rating) ? 'var(--brass)' : 'var(--steel)'}
                  />
                </button>
              ))}
            </div>
            {Number(formData.rating) > 0 && (
              <button
                type="button"
                className="link-btn"
                style={{ fontSize: '0.8rem' }}
                onClick={() => onRatingChange(0)}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="game-desc" className="form-label">
          Synopsis / Personal Notes
        </label>
        <textarea
          id="game-desc"
          name="description"
          rows={3}
          value={formData.description}
          onChange={onFormChange}
          placeholder="Short summary, current build, or why it's in your backlog…"
          className="form-textarea"
        />
      </div>

      <fieldset className="form-fieldset">
        <div className="fieldset-header">
          <span className="form-label">Game Specs &amp; Metadata</span>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onAddSpec}
          >
            <Plus size={14} /> Add Spec
          </button>
        </div>

        <div className="multi-rows">
          {specs.map((spec, idx) => (
            <div key={idx} className="multi-row">
              <input
                type="text"
                placeholder="Label (e.g. Developer)"
                value={spec.name}
                onChange={(e) => onSpecChange(idx, 'name', e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Value (e.g. Team Cherry)"
                value={spec.quantity}
                onChange={(e) => onSpecChange(idx, 'quantity', e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRemoveSpec(idx)}
                disabled={specs.length <= 1}
                aria-label="Remove spec"
                title="Remove spec"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <div className="fieldset-header">
          <span className="form-label">Playthrough Milestones</span>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onAddNote}
          >
            <Plus size={14} /> Add Milestone
          </button>
        </div>

        <div className="multi-rows">
          {notes.map((note, idx) => (
            <div key={idx} className="step-row">
              <span className="step-num">{idx + 1}</span>
              <input
                type="text"
                placeholder="e.g. Clear Act 1 boss or collect all upgrades…"
                value={note}
                onChange={(e) => onNoteChange(idx, e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRemoveNote(idx)}
                disabled={notes.length <= 1}
                aria-label="Remove milestone"
                title="Remove milestone"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="form-actions-bar">
        <button
          type="button"
          className="btn btn--outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader size={16} className="spin" /> {submittingLabel}
            </>
          ) : (
            <>
              <Save size={16} /> {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
