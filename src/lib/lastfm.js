/**
 * Last.fm Public Web API — browser-side fetch layer.
 * All functions return Promise<T | null>; errors are never thrown.
 */

const BASE = 'http://ws.audioscrobbler.com/2.0'
const LIMIT = 50 // Top tracks limit (lastfm max is 50)

function get(key) {
  const params = new URLSearchParams({ method: key, format: 'json' })
  const apiKey = import.meta.env.VITE_LASTFM_API_KEY
  if (apiKey) params.set('api_key', apiKey)
  return `${BASE}?${params.toString()}`
}

// ── helpers ───────────────────────────────────────

/** Extract largest image URL from last.fm image array, or null. */
export function img(arr) {
  if (!Array.isArray(arr)) return ''
  // last.fm images are ordered small → medium → large → extralarge
  const best = arr[arr.length - 1]
  return typeof best === 'string' ? best : (best?.['#text'] ?? '')
}

// ── API functions ────────────────────────────────

/** Fetch basic user info (name, avatar, total scrobbles). */
export async function fetchUserInfo(username) {
  const url = get('user.getInfo') + `&user=${encodeURIComponent(username)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const user = json?.user
    if (!user) return null
    return {
      name: user.name || username,
      image: img(user.image),
      // user.playcount is returned by the free/public API for all profiles
      // user.stats.scrobbles is only available with OAuth authentication
      scrobbles: parseInt(user.playcount ?? user.stats?.scrobbles, 10) || 0,
    }
  } catch {
    return null
  }
}

/** Fetch top tracks for a user. */
export async function fetchTopTracks(username) {
  const url = get('user.getTopTracks') + `&user=${encodeURIComponent(username)}&limit=${LIMIT}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const toptracks = json?.toptracks
    if (!toptracks || !Array.isArray(toptracks.track)) return null
    return {
      tracks: toptracks.track,
      totalScrobbles: parseInt(toptracks['@attr']?.totalScrobbles, 10) || 0,
    }
  } catch {
    return null
  }
}

/** Fetch recent tracks for a user (up to 200). */
export async function fetchRecentTracks(username) {
  const url = get('user.getRecentTracks') + `&user=${encodeURIComponent(username)}&limit=200`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const recenttracks = json?.recenttracks?.track
    if (!Array.isArray(recenttracks)) return null
    return recenttracks
  } catch {
    return null
  }
}

/** Fetch top albums for a user. */
export async function fetchTopAlbums(username) {
  const url = get('user.getTopAlbums') + `&user=${encodeURIComponent(username)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const topalbums = json?.topalbums
    if (!topalbums || !Array.isArray(topalbums.album)) return null
    return topalbums.album
  } catch {
    return null
  }
}

/** Fetch top artists for a user. */
export async function fetchTopArtists(username) {
  const url = get('user.getTopArtists') + `&user=${encodeURIComponent(username)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const topartists = json?.topartists
    if (!topartists || !Array.isArray(topartists.artist)) return null
    return topartists.artist
  } catch {
    return null
  }
}

/** Fetch genre tags for a specific artist (used for genre analysis). */
export async function fetchArtistTags(artistName) {
  const url = get('artist.getInfo') + `&artist=${encodeURIComponent(artistName)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const artist = json?.artist
    return artist?.tags?.tag?.map(t => t.name.toLowerCase()) ?? []
  } catch {
    return []
  }
}
