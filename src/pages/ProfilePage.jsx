import { useState, useMemo } from 'react'
import {
  Gamepad2,
  Copy,
  Check,
  Save,
  Heart,
  FileText,
  Clock,
  Camera,
  Play,
  Trash2,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useGames, clearCachedGames } from '../hooks/useGames'
import { getAllDraftIds, clearAllDrafts } from '../utils/draftStorage'
import { formatHours } from '../utils/helpers'

/**
 * ProfilePage — Displays Student Identity (Nama, NIM, Kelompok),
 * player handle, avatar, UUID, live shelf metrics, and local storage utilities.
 */
export default function ProfilePage({ onReplaySplash }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [nama, setNama] = useState(profile.nama || '')
  const [nim, setNim] = useState(profile.nim || '')
  const [kelompok, setKelompok] = useState(profile.kelompok || '')
  const [username, setUsername] = useState(profile.username || 'Player One')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)

  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [draftCount, setDraftCount] = useState(() => getAllDraftIds().length)

  const { favorites } = useFavorites()
  const { games } = useGames({ limit: 100 })

  const totalHours = useMemo(
    () => games.reduce((sum, g) => sum + (Number(g.hours_played) || 0), 0),
    [games],
  )

  const showToast = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 3200)
  }

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showToast('Avatar image must be under 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      showToast('Avatar updated.')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const result = userService.saveUserProfile({
      nama: nama.trim() || 'Fitrandi Sabila Mustaqim',
      nim: nim.trim() || '21120124130061',
      kelompok: kelompok.trim() || 'Kelompok 32 Shift 05',
      username: username.trim() || 'Fitrandi',
      bio: bio.trim(),
      avatar,
    })

    if (result.success) {
      setProfile(result.data)
      showToast('Profile identity saved.')
    } else {
      showToast('Failed to save profile.')
    }
  }

  const handleClearDrafts = () => {
    clearAllDrafts()
    setDraftCount(0)
    showToast('Saved drafts cleared.')
  }

  const handleClearCache = () => {
    clearCachedGames()
    showToast('Offline game cache cleared.')
  }

  return (
    <div className="profile-page">
      <section
        className="masthead"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="display">Player &amp; Student Profile</h1>
          <p className="lede">
            Practicum identity (Nama, NIM, Kelompok), shelf metrics, and offline
            preferences.
          </p>
        </div>

        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay intro animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Identity & Stats Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt={profile.nama} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Gamepad2 size={36} stroke="var(--brass)" />
              </div>
            )}
            <label
              htmlFor="avatar-file-input"
              className="avatar-upload-btn"
              title="Upload avatar"
            >
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.nama}</h2>
            <p className="type" style={{ margin: '0 0 8px' }}>
              Handle: <strong>@{profile.username}</strong>
            </p>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User UUID"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Required Responsi Identity Fields */}
        <div className="identity-grid">
          <div className="identity-box">
            <span className="identity-label">Nama</span>
            <span className="identity-value">{profile.nama}</span>
          </div>
          <div className="identity-box">
            <span className="identity-label">NIM</span>
            <span className="identity-value">{profile.nim}</span>
          </div>
          <div className="identity-box">
            <span className="identity-label">Kelompok</span>
            <span className="identity-value">{profile.kelompok}</span>
          </div>
        </div>

        {/* Shelf Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <Gamepad2 size={20} stroke="var(--ink)" />
            <div className="stat-val">{games.length}</div>
            <div className="stat-label">Games Logged</div>
          </div>
          <div className="stat-item">
            <Clock size={20} stroke="var(--brass)" />
            <div className="stat-val">{formatHours(totalHours)}</div>
            <div className="stat-label">Total Hours</div>
          </div>
          <div className="stat-item">
            <Heart size={20} stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} stroke="var(--steel)" />
            <div className="stat-val">{draftCount}</div>
            <div className="stat-label">Saved Drafts</div>
          </div>
        </div>
      </div>

      {/* Edit Student & Gamer Details */}
      <form onSubmit={handleSaveProfile} className="profile-form">
        <h3 className="section-title">Edit Student &amp; Player Details</h3>

        <div className="form-grid form-grid--3">
          <div className="form-group">
            <label htmlFor="prof-nama" className="form-label">
              Nama Lengkap
            </label>
            <input
              id="prof-nama"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama mahasiswa"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prof-nim" className="form-label">
              NIM
            </label>
            <input
              id="prof-nim"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="211201..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prof-kelompok" className="form-label">
              Kelompok
            </label>
            <input
              id="prof-kelompok"
              type="text"
              value={kelompok}
              onChange={(e) => setKelompok(e.target.value)}
              placeholder="Kelompok ..."
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="prof-username" className="form-label">
            Gamer Handle / Alias (used in Play Logs)
          </label>
          <input
            id="prof-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Player One"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="prof-bio" className="form-label">
            Bio &amp; Favorite Genres
          </label>
          <textarea
            id="prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Favorite genres, current main platform, backlog goals…"
            className="form-textarea"
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button type="submit" className="btn btn--primary">
            <Save size={16} /> Save Profile
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleClearDrafts}
          >
            <Trash2 size={14} /> Clear Drafts ({draftCount})
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleClearCache}
          >
            <Trash2 size={14} /> Clear Offline Cache
          </button>
        </div>
      </form>
    </div>
  )
}
