import { apiClient, IS_SUPABASE } from '../config/api'
import { getDefaultCoverForPlatform } from '../utils/helpers'

// ---------------------------------------------------------------------------
// Normalizer — standardizes game shape from Supabase `public.games`
// ---------------------------------------------------------------------------
export const normalizeGame = (item) => {
  if (!item) return null

  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Detail',
          quantity: s.trim(),
        }
      }
      return {
        id: s.id || `spec-${idx}`,
        name: s.name || 'Detail',
        quantity: s.quantity || '',
      }
    })
  }

  const notesList = Array.isArray(item.notes)
    ? item.notes.filter((n) => typeof n === 'string' && n.trim().length > 0)
    : []

  const platform = item.platform || 'PC'
  const cover = item.cover_url || getDefaultCoverForPlatform(platform)

  return {
    ...item,
    id: item.id,
    title: item.title || 'Untitled Game',
    platform,
    genre: item.genre || 'Action',
    status: item.status || 'Backlog',
    release_year: item.release_year ? Number(item.release_year) : null,
    hours_played: Number(item.hours_played ?? 0),
    rating: Number(item.rating ?? 0),
    description: item.description || '',
    cover_url: cover,
    specs: specsList,
    notes: notesList,
  }
}

const serializeSpecs = (specs) => {
  if (!Array.isArray(specs)) return undefined
  return specs
    .filter((s) => (typeof s === 'string' ? s.trim() : s?.name?.trim()))
    .map((s) =>
      typeof s === 'string'
        ? s.trim()
        : `${s.name.trim()}: ${(s.quantity || 'Standard').trim()}`,
    )
}

const serializeNotes = (notes) => {
  if (!Array.isArray(notes)) return undefined
  return notes
    .map((n) => (typeof n === 'string' ? n.trim() : String(n || '').trim()))
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// GameService — CRUD wrapper for Supabase PostgREST (/rest/v1/games)
// ---------------------------------------------------------------------------
class GameService {
  async getGames(params = {}) {
    if (!IS_SUPABASE) {
      throw new Error('Supabase configuration is missing.')
    }

    const queryParts = ['select=*']

    if (params.search) {
      queryParts.push(`title=ilike.*${encodeURIComponent(params.search)}*`)
    }

    if (params.status && params.status !== 'All') {
      queryParts.push(`status=eq.${encodeURIComponent(params.status)}`)
    }

    if (params.platform && params.platform !== 'All') {
      queryParts.push(`platform=eq.${encodeURIComponent(params.platform)}`)
    }

    if (params.sort_by) {
      const order = params.order === 'asc' ? 'asc' : 'desc'
      queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order}`)
    } else {
      queryParts.push('order=created_at.desc')
    }

    if (params.limit) {
      queryParts.push(`limit=${Number(params.limit)}`)
    }

    const data = await apiClient.get(`/rest/v1/games?${queryParts.join('&')}`)
    const list = Array.isArray(data) ? data.map(normalizeGame) : []

    return {
      success: true,
      data: list,
      pagination: {
        total: list.length,
        page: params.page || 1,
        limit: params.limit || 100,
      },
    }
  }

  async getGameById(id) {
    const data = await apiClient.get(`/rest/v1/games?id=eq.${encodeURIComponent(id)}&select=*`)
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data: normalizeGame(data[0]) }
    }
    throw new Error('Game record not found.')
  }

  async createGame(data) {
    const payload = {
      title: String(data.title || '').trim(),
      platform: data.platform || 'PC',
      genre: String(data.genre || 'Action').trim(),
      status: data.status || 'Backlog',
      release_year: data.release_year ? Number(data.release_year) : null,
      hours_played: Number(data.hours_played ?? 0),
      rating: Number(data.rating ?? 0),
      description: String(data.description || '').trim(),
      specs: serializeSpecs(data.specs) || [],
      notes: serializeNotes(data.notes) || [],
      cover_url: data.cover_url || getDefaultCoverForPlatform(data.platform),
    }

    const res = await apiClient.post('/rest/v1/games', payload, {
      headers: { Prefer: 'return=representation' },
    })
    const created = Array.isArray(res) ? res[0] : res
    return { success: true, data: normalizeGame(created) }
  }

  async updateGame(id, data) {
    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) payload.title = String(data.title).trim()
    if (data.platform !== undefined) payload.platform = data.platform
    if (data.genre !== undefined) payload.genre = String(data.genre).trim()
    if (data.status !== undefined) payload.status = data.status
    if (data.release_year !== undefined) {
      payload.release_year = data.release_year ? Number(data.release_year) : null
    }
    if (data.hours_played !== undefined) payload.hours_played = Number(data.hours_played ?? 0)
    if (data.rating !== undefined) payload.rating = Number(data.rating ?? 0)
    if (data.description !== undefined) payload.description = String(data.description).trim()
    if (data.cover_url !== undefined) payload.cover_url = data.cover_url

    const specs = serializeSpecs(data.specs)
    if (specs !== undefined) payload.specs = specs

    const notes = serializeNotes(data.notes)
    if (notes !== undefined) payload.notes = notes

    const res = await apiClient.patch(
      `/rest/v1/games?id=eq.${encodeURIComponent(id)}`,
      payload,
      { headers: { Prefer: 'return=representation' } },
    )
    const updated = Array.isArray(res) ? res[0] : res
    return { success: true, data: normalizeGame(updated) }
  }

  async deleteGame(id) {
    await apiClient.delete(`/rest/v1/games?id=eq.${encodeURIComponent(id)}`)
    return { success: true }
  }
}

export default new GameService()
