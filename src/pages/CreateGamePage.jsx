import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  X,
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

const CURRENT_YEAR = new Date().getFullYear()

const COVER_PRESETS = [
  { label: 'PC Cover', url: '/covers/pc.svg' },
  { label: 'Console Cover', url: '/covers/console.svg' },
  { label: 'Handheld Cover', url: '/covers/handheld.svg' },
  { label: 'Retro Cover', url: '/covers/retro.svg' },
]

/**
 * CreateGamePage — Two-step form for logging a new game to Supabase,
 * with cover upload/preset selection and localStorage draft auto-save.
 */
export default function CreateGamePage({ onBack, onSuccess }) {
  const [currentStep, setCurrentStep] = useState('upload')

  const [formData, setFormData] = useState({
    title: '',
    platform: 'PC',
    genre: 'Action RPG',
    status: 'Playing',
    release_year: CURRENT_YEAR,
    hours_played: 0,
    rating: 0,
    description: '',
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState('')

  const [specs, setSpecs] = useState([
    { name: 'Developer', quantity: '' },
    { name: 'Mode', quantity: 'Single-player' },
  ])

  const [notes, setNotes] = useState([
    'Complete prologue / tutorial area',
  ])

  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [showDraftModal, setShowDraftModal] = useState(() => hasDraft('create'))
  const [draftTimestamp, setDraftTimestamp] = useState(() =>
    getDraftTimestamp('create'),
  )

  const handleSaveDraft = useCallback(
    (notify = true) => {
      const saved = saveDraft(
        { formData, specs, notes, uploadedCoverUrl },
        'create',
      )
      if (saved) {
        const ts = getDraftTimestamp('create')
        setDraftTimestamp(ts)
        if (notify) {
          setSuccessMsg(`Draft saved (${formatDraftTime(ts)})`)
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      }
    },
    [formData, specs, notes, uploadedCoverUrl],
  )

  useEffect(() => {
    if (currentStep !== 'form') return
    const interval = setInterval(() => {
      handleSaveDraft(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [handleSaveDraft, currentStep])

  const handleLoadDraft = () => {
    const draft = loadDraft('create')
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.notes) setNotes(draft.notes)
      if (draft.uploadedCoverUrl) {
        setUploadedCoverUrl(draft.uploadedCoverUrl)
        setImagePreview(draft.uploadedCoverUrl)
      }
      setCurrentStep('form')
      setShowDraftModal(false)
      setSuccessMsg('Draft restored.')
      setTimeout(() => setSuccessMsg(''), 3500)
    }
  }

  const handleDiscardDraft = () => {
    deleteDraft('create')
    setShowDraftModal(false)
    setDraftTimestamp(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5 MB limit.')
      return
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Allowed formats: .jpg, .jpeg, .png, .webp')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSelectPreset = (url) => {
    setImageFile(null)
    setImagePreview(url)
    setUploadedCoverUrl(url)
    setCurrentStep('form')
    setError('')
  }

  const handleUploadImage = async () => {
    if (!imageFile) {
      setUploadedCoverUrl(
        uploadedCoverUrl ||
          imagePreview ||
          getDefaultCoverForPlatform(formData.platform),
      )
      setCurrentStep('form')
      return
    }

    try {
      setUploading(true)
      setError('')
      const result = await uploadService.uploadImage(imageFile)
      if (result.success && result.data?.url) {
        setUploadedCoverUrl(result.data.url)
        setCurrentStep('form')
      } else {
        throw new Error('Upload failed.')
      }
    } catch (err) {
      setError(err.message || 'Cover upload failed.')
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

    if (!formData.title.trim() || formData.title.trim().length < 2) {
      setError('Game title must be at least 2 characters.')
      return
    }

    const coverUrl =
      uploadedCoverUrl || getDefaultCoverForPlatform(formData.platform)

    try {
      setCreating(true)
      const response = await gameService.createGame({
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
        deleteDraft('create')
        if (onSuccess) {
          onSuccess(response.data)
        } else if (onBack) {
          onBack()
        }
      } else {
        throw new Error(response.message || 'Failed to log game.')
      }
    } catch (err) {
      setError(err.message || 'Unable to save game to Supabase.')
    } finally {
      setCreating(false)
    }
  }

  const activeCover =
    uploadedCoverUrl || imagePreview || getDefaultCoverForPlatform(formData.platform)

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Shelf
        </button>

        {currentStep === 'form' && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => handleSaveDraft(true)}
          >
            <Save size={14} /> Save Draft
          </button>
        )}
      </div>

      <div className="form-title-group">
        <h1 className="display">Log New Game</h1>
        <p className="lede">
          Add a game to your shelf with cover art, play status, hours logged, and
          playthrough milestones.
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

      <div className="form-steps-nav">
        <div
          className={`step-badge ${
            currentStep === 'upload' ? 'step-badge--active' : 'step-badge--done'
          }`}
        >
          1. Cover Art
        </div>
        <div className="step-badge-connector" />
        <div
          className={`step-badge ${
            currentStep === 'form' ? 'step-badge--active' : ''
          }`}
        >
          2. Game Details &amp; Progress
        </div>
      </div>

      {currentStep === 'upload' && (
        <div className="card-box">
          <h2 className="card-box-title">Game Cover Art</h2>
          <p className="card-box-desc">
            Upload custom box art or a screenshot (max 5 MB), or pick a platform
            cover preset.
          </p>

          {!imagePreview ? (
            <div className="upload-dropzone">
              <input
                id="game-cover-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
              <label htmlFor="game-cover-input" className="upload-label">
                <Upload size={36} className="upload-icon" />
                <span className="upload-main-text">Click to choose a cover image</span>
                <span className="upload-sub-text">JPG, PNG, or WebP up to 5 MB</span>
              </label>

              <div className="preset-selector">
                <span className="preset-title">Or choose a platform cover preset:</span>
                <div className="preset-pills">
                  {COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      className="pill"
                      onClick={() => handleSelectPreset(preset.url)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="preview-container">
              <div className="preview-image-wrap">
                <img src={imagePreview} alt="Cover preview" className="preview-img" />
                <button
                  type="button"
                  className="preview-remove-btn"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    setUploadedCoverUrl('')
                  }}
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="preview-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleUploadImage}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader size={18} className="spin" /> Uploading Cover…
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Confirm Cover &amp; Continue
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    setUploadedCoverUrl(getDefaultCoverForPlatform(formData.platform))
                    setCurrentStep('form')
                  }}
                >
                  Skip &amp; Use Default
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'form' && (
        <>
          <div className="selected-thumb-bar">
            <img src={activeCover} alt="Selected cover" className="thumb-small" />
            <div className="thumb-info">
              <span className="thumb-title">Cover Art Selected</span>
              <span className="thumb-sub">Ready to log into your shelf</span>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setCurrentStep('upload')}
            >
              Change Cover
            </button>
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
            submitting={creating}
            submitLabel="Add to Shelf"
            submittingLabel="Saving Game…"
          />
        </>
      )}

      <ConfirmModal
        open={showDraftModal}
        title="Restore Unsaved Draft?"
        message={`You have an unsaved game draft from ${formatDraftTime(draftTimestamp)}. Would you like to continue editing it?`}
        confirmLabel="Restore Draft"
        cancelLabel="Discard"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
