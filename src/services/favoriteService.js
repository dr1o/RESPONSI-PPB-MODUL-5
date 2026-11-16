import { apiClient, IS_SUPABASE } from '../config/api'
import { normalizeGame } from './gameService'

// ---------------------------------------------------------------------------
// FavoriteService — Supabase `public.game_favorites` with `games(*)` join.
// ---------------------------------------------------------------------------
class FavoriteService {
  async getFavorites(userId) {
    if (!IS_SUPABASE) {
      throw new Error('Supabase configuration is missing.')
    }

    const data = await apiClient.get(
      `/rest/v1/game_favorites?user_id=eq.${encodeURIComponent(userId)}&select=game_id,created_at,games(*)&order=created_at.desc`,
    )

    const list = Array.isArray(data)
      ? data.map((fav) => {
          const game = fav.games ? normalizeGame(fav.games) : null
          return {
            ...(game || {}),
            id: fav.game_id,
            game_id: fav.game_id,
            favorited_at: fav.created_at,
          }
        })
      : []

    return { success: true, data: list }
  }

  async toggleFavorite({ game_id, user_identifier }) {
    const targetId = Number(game_id)
    if (Number.isNaN(targetId)) {
      throw new Error('Offline or local-only item requires local favorites.')
    }

    const existing = await apiClient.get(
      `/rest/v1/game_favorites?game_id=eq.${targetId}&user_id=eq.${encodeURIComponent(user_identifier)}&select=id`,
    )

    if (Array.isArray(existing) && existing.length > 0) {
      await apiClient.delete(
        `/rest/v1/game_favorites?game_id=eq.${targetId}&user_id=eq.${encodeURIComponent(user_identifier)}`,
      )
      return { success: true, data: { is_favorited: false } }
    }

    await apiClient.post(
      '/rest/v1/game_favorites',
      { game_id: targetId, user_id: user_identifier },
      { headers: { Prefer: 'return=minimal' } },
    )
    return { success: true, data: { is_favorited: true } }
  }
}

export default new FavoriteService()
