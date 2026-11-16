import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  Loader,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import gameService from '../services/gameService'
import uploadService from '../services/uploadService'
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import { getDefaultCoverForPlatform } from '../utils/helpers'
import ConfirmModal from '../components/modals/ConfirmModal'
import GameFormFields from '../components/game/GameFormFields'

const COVER_PRESETS = [
  { label: 'PC', url: '/covers/pc.svg' },
  { label: 'Console', url: '/covers/console.svg' },
  { label: 'Handheld', url: '/covers/handheld.svg' },
  { label: 'Retro', url: '/covers/retro.svg' },
]

const buildInitialForm = (data) => ({
  title: data?.title || '',
  platform: data?.platform || 'PC',
  genre: data?.genre || 'Action RPG',
  status: data?.status || 'Backlog',
  release_year: data?.release_year || '',
  hours_played: data?.hours_played ?? 0,
  rating: data?.rating ?? 0,
  description: data?.description || '',
})

/**
 * EditGamePage — Edit an existing game record in Supabase,
 * with cover art replacement and localStorage draft support.
 */
export default function EditGamePage({ game, gameId, onBack, onSuccess }) {
  const targetId = gameId || game?.id
  const isLocalSample = String(targetId || '').startsWith('local-')

  const [loading, setLoading] = useState(!game)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState(() => buildInitialForm(game))
  const [coverUrl, setCoverUrl] = useState(
    () => game?.cover_url || getDefaultCoverForPlatform(game?.platform),
  )
  const [specs, setSpecs] = useState(() =>
    game?.specs?.length > 0
      ? game.specs.map((s) => ({ name: s.name || '', quantity: s.quantity || '' }))
      : [{ name: 'Developer', quantity: '' }],
  )
  const [notes, setNotes] = useState(() =>
    game?.notes?.length > 0 ? [...game.notes] : [''],
  )

  const [showDraftModal, setShowDraftModal] = useState(() =>
    targetId ? hasDraft(targetId) : false,
  )
  const [draftTimestamp, setDraftTimestamp] = useState(() =>
    targetId ? getDraftTimestamp(targetId) : null,
  )

  const applyGameData = useCallback((data) => {
    setFormData(buildInitialForm(data))
    setCoverUrl(data.cover_url || getDefaultCoverForPlatform(data.platform))
    setSpecs(
      data.specs?.length > 0
        ? data.specs.map((s) => ({ name: s.name || '', quantity: s.quantity || '' }))
        : [{ name: 'Developer', quantity: '' }],
    )
    setNotes(data.notes?.length > 0 ? [...data.notes] : [''])
  }, [])

  useEffect(() => {
    if (game || !targetId || isLocalSample) return
    let cancelled = false

    Promise.resolve().then(async () => {
      try {
        const res = await gameService.getGameById(targetId)
        if (!cancelled && res.success && res.data) {
          applyGameData(res.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load game record.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [game, targetId, isLocalSample, applyGameData])

  const handleSaveDraft = () => {
    if (!targetId) return
    const ok = saveDraft({ formData, specs, notes, coverUrl }, targetId)
    if (ok) {
      const ts = getDraftTimestamp(targetId)
      setDraftTimestamp(ts)
      setSuccessMsg(`Draft saved (${formatDraftTime(ts)})`)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleLoadDraft = () => {
    const draft = loadDraft(targetId)
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.notes) setNotes(draft.notes)
      if (draft.coverUrl) setCoverUrl(draft.coverUrl)
      setShowDraftModal(false)
      setSuccessMsg('Draft restored.')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleDiscardDraft = () => {
    if (targetId) deleteDraft(targetId)
    setShowDraftModal(false)
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const res = await uploadService.uploadImage(file)
      if (res.success && res.data?.url) {
        setCoverUrl(res.data.url)
        setSuccessMsg('Cover art updated.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (err) {
      setError(err.message || 'Failed to upload cover.')
    } finally {
      setUploading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSpecChange = (idx, field, value) => {
    setSpecs((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const handleNoteChange = (idx, value) => {
    setNotes((prev) => prev.map((item, i) => (i === idx ? value : item)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isLocalSample) {
      setError('Offline sample entries cannot be edited directly. Log a new game while online.')
      return
    }

    if (!formData.title.trim() || formData.title.trim().length < 2) {
      setError('Game title must be at least 2 characters.')
      return
    }

    try {
      setUpdating(true)
      const response = await gameService.updateGame(targetId, {
        ...formData,
        title: formData.title.trim(),
        genre: formData.genre.trim() || 'Action',
        release_year: formData.release_year ? Number(formData.release_year) : null,
        hours_played: Number(formData.hours_played) || 0,
        rating: Number(formData.rating) || 0,
        specs,
        notes,
        cover_url: coverUrl,
      })

      if (response.success || response.data) {
        if (targetId) deleteDraft(targetId)
        if (onSuccess) {
          onSuccess(response.data)
        } else if (onBack) {
          onBack()
        }
      } else {
        throw new Error('Failed to update game.')
      }
    } catch (err) {
      setError(err.message || 'Failed to update game on Supabase.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="form-page">
        <div className="state-box">
          <Loader size={28} className="spin" />
          <p>Loading game details…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Shelf
        </button>

        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleSaveDraft}
        >
          <Save size={14} /> Save Draft
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Edit {formData.title || 'Game'}</h1>
        <p className="lede">
          Update play status, hours played, personal rating, cover art, or milestones.
        </p>
      </div>

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <div className="card-box">
        <h2 className="card-box-title">Cover Art</h2>
        <div className="edit-img-wrap">
          <img
            src={coverUrl || getDefaultCoverForPlatform(formData.platform)}
            alt={formData.title || 'Cover'}
            className="edit-current-img"
          />
          <div className="edit-img-controls">
            <label htmlFor="edit-cover-input" className="btn btn--outline btn--sm" style={{ width: 'fit-content' }}>
              {uploading ? (
                <>
                  <Loader size={14} className="spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} /> Replace Cover Image
                </>
              )}
              <input
                id="edit-cover-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCoverUpload}
                className="hidden-file-input"
              />
            </label>

            <div className="preset-pills" style={{ justifyContent: 'flex-start' }}>
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  className={`pill${coverUrl === preset.url ? ' pill--active' : ''}`}
                  onClick={() => setCoverUrl(preset.url)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GameFormFields
        formData={formData}
        onFormChange={handleFormChange}
        onRatingChange={(r) => setFormData((prev) => ({ ...prev, rating: r }))}
        specs={specs}
        onSpecChange={handleSpecChange}
        onAddSpec={() => setSpecs((prev) => [...prev, { name: '', quantity: '' }])}
        onRemoveSpec={(idx) =>
          specs.length > 1 && setSpecs((prev) => prev.filter((_, i) => i !== idx))
        }
        notes={notes}
        onNoteChange={handleNoteChange}
        onAddNote={() => setNotes((prev) => [...prev, ''])}
        onRemoveNote={(idx) =>
          notes.length > 1 && setNotes((prev) => prev.filter((_, i) => i !== idx))
        }
        onSubmit={handleSubmit}
        onCancel={onBack}
        submitting={updating}
        submitLabel="Save Changes"
        submittingLabel="Updating…"
      />

      <ConfirmModal
        open={showDraftModal}
        title="Restore Unsaved Edit Draft?"
        message={`Found an unsaved draft for this game from ${formatDraftTime(draftTimestamp)}. Restore it?`}
        confirmLabel="Restore Draft"
        cancelLabel="Discard"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
