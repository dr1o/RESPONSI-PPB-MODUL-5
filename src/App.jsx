import { useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import ShelfPage from './pages/ShelfPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import CreateGamePage from './pages/CreateGamePage.jsx'
import EditGamePage from './pages/EditGamePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import GameDetail from './components/game/GameDetail.jsx'
import { useFavorites } from './hooks/useFavorites.js'
import gameService from './services/gameService.js'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Shelf')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedGame, setSelectedGame] = useState(null)
  const [editingGame, setEditingGame] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { favorites } = useFavorites()

  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setTab('Create')
      setMode('create')
      setSelectedGame(null)
      setEditingGame(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGame(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGame(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTab(target)
      setMode('list')
      setSelectedGame(null)
      setEditingGame(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToShelf = () => {
    setMode('list')
    setTab('Shelf')
    setSelectedGame(null)
    setEditingGame(null)
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' || mode === 'create' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        favCount={favorites.length}
      />

      <main className="main">
        {mode === 'create' && (
          <CreateGamePage
            onBack={handleBackToShelf}
            onSuccess={() => {
              setRefreshKey((k) => k + 1)
              handleBackToShelf()
            }}
          />
        )}

        {mode === 'edit' && editingGame && (
          <EditGamePage
            game={editingGame}
            gameId={editingGame.id}
            onBack={handleBackToShelf}
            onSuccess={() => {
              setRefreshKey((k) => k + 1)
              handleBackToShelf()
            }}
          />
        )}

        {mode === 'detail' && selectedGame && (
          <GameDetail
            game={selectedGame}
            onBack={handleBackToShelf}
            onEdit={(g) => handleNavigate('Edit', g)}
            onDelete={
              String(selectedGame.id).startsWith('local-')
                ? undefined
                : (g) => setDeleteTarget(g)
            }
          />
        )}

        {mode === 'list' && (
          <>
            {tab === 'Shelf' && (
              <ShelfPage
                key={`shelf-${refreshKey}`}
                onNavigate={(dest, payload) => handleNavigate(dest, payload)}
              />
            )}
            {tab === 'Favorites' && (
              <FavoritesPage
                key={`favs-${refreshKey}`}
                onSelectGame={(g) => handleNavigate('Detail', g)}
                onEditGame={(g) => handleNavigate('Edit', g)}
                onDeleteGame={(g) => setDeleteTarget(g)}
                onNavigateShelf={() => handleNavigate('Shelf')}
              />
            )}
            {tab === 'Profile' && (
              <ProfilePage onReplaySplash={() => setShowSplash(true)} />
            )}
          </>
        )}
      </main>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Game Entry"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from your shelf? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await gameService.deleteGame(deleteTarget.id)
            setDeleteTarget(null)
            setRefreshKey((k) => k + 1)
            handleBackToShelf()
          } catch (err) {
            alert(err.message || 'Failed to delete game.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
