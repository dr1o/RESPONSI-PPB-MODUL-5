import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import './SplashScreen.css'

/**
 * SplashScreen — Signature cartridge lock-in intro for ShelfLog.
 */
export default function SplashScreen({ onFinish, duration = 3600 }) {
  const [isHit, setIsHit] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const dismissedRef = useRef(false)

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setIsFading(true)
    setTimeout(() => {
      if (onFinish) onFinish()
    }, 550)
  }, [onFinish])

  const handlePulse = (e) => {
    if (e.target.closest('.splash-skip-btn')) return
    setIsHit(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsHit(true)
      })
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [duration, handleDismiss])

  return (
    <main
      className={`splash-overlay ${isHit ? 'hit' : ''} ${isFading ? 'splash-overlay--fading' : ''}`}
      id="splash"
      onClick={handlePulse}
      role="dialog"
      aria-modal="true"
      aria-label="ShelfLog Intro"
    >
      <div className="splash-trail" aria-hidden="true" />
      <div className="splash-flash" aria-hidden="true" />

      <svg
        className="splash-grid"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 150 H800 M0 300 H800 M0 450 H800 M200 0 V600 M400 0 V600 M600 0 V600" />
      </svg>

      <img className="splash-mark" src="/logo.png" alt="ShelfLog Logo" />

      <section className="splash-brand">
        <div className="splash-brand-name">ShelfLog</div>
        <div className="splash-brand-sub">PERSONAL VIDEO GAME ARCHIVE</div>
      </section>

      <button
        type="button"
        className="splash-skip-btn"
        onClick={(e) => {
          e.stopPropagation()
          handleDismiss()
        }}
        aria-label="Skip splash screen"
      >
        <span>Enter Shelf</span>
        <ArrowRight size={14} />
      </button>

      <span className="splash-hint">Tap anywhere to pulse</span>
    </main>
  )
}
