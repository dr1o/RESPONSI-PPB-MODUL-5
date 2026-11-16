import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// LogService — Play session logs & reviews in Supabase `public.game_logs`.
// ---------------------------------------------------------------------------
class LogService {
  async getLogs(gameId) {
    if (!IS_SUPABASE) {
      throw new Error('Supabase configuration is missing.')
    }

    const numericId = Number(gameId)
    if (Number.isNaN(numericId)) {
      return { success: true, data: [] }
    }

    const data = await apiClient.get(
      `/rest/v1/game_logs?game_id=eq.${numericId}&select=*&order=created_at.desc`,
    )

    const list = Array.isArray(data)
      ? data.map((row) => ({
          id: row.id,
          game_id: row.game_id,
          user_id: row.user_id,
          author_name: row.author_name || 'Player',
          rating: Number(row.rating || 5),
          hours_logged: Number(row.hours_logged || 0),
          comment: row.comment || '',
          created_at: row.created_at,
        }))
      : []

    return { success: true, data: list }
  }

  async createLog(gameId, logData) {
    const numericId = Number(gameId)
    if (Number.isNaN(numericId)) {
      throw new Error('Logs require a synced Supabase game ID.')
    }

    const payload = {
      game_id: numericId,
      user_id: logData.user_id,
      author_name: String(logData.author_name || 'Player').trim() || 'Player',
      rating: Number(logData.rating || 5),
      hours_logged: Number(logData.hours_logged || 0),
      comment: String(logData.comment || '').trim(),
    }

    const res = await apiClient.post('/rest/v1/game_logs', payload, {
      headers: { Prefer: 'return=representation' },
    })
    const created = Array.isArray(res) ? res[0] : res
    return { success: true, data: created }
  }

  async deleteLog(logId) {
    await apiClient.delete(`/rest/v1/game_logs?id=eq.${encodeURIComponent(logId)}`)
    return { success: true }
  }
}

export default new LogService()
