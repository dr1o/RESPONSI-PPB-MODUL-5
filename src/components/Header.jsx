import { Plus } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'Shelf', label: 'Shelf' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true },
  { id: 'Create', label: 'Log Game' },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate, favCount = 0 }) {
  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Shelf')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onTab('Shelf')
        }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="ShelfLog" />
        </div>
        <span className="brand display">ShelfLog</span>
      </div>

      <nav className="nav" aria-label="Primary Navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Log a new game"
        >
          <Plus size={15} /> Log Game
        </button>
      )}
    </header>
  )
}

export default Header
