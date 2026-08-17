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

/** Filename of the generic Last.fm no-image placeholder icon. */
const NOIMAGE_ID = '2a96cbd8b46e442fc41c2b86b821562f.png'

/** Resolve a Last.fm album image array into the largest real URL, or empty string if none. */
export function pickImg(arr) {
  if (!arr || typeof arr === 'string') return ''
  if (Array.isArray(arr)) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const entry = arr[i]
      const url = typeof entry === 'string' ? entry : (entry?.['#text'] ?? '')
      if (url && !url.includes(NOIMAGE_ID) && (url.startsWith('http') || url.startsWith('//'))) {
        return url.startsWith('//') ? `https:${url}` : url
      }
    }
  }
  if (typeof arr === 'object') {
    const url = arr.url ?? arr.src ?? arr.href ?? ''
    if (typeof url === 'string' && url.startsWith('http') && !url.includes(NOIMAGE_ID)) return url
  }
  return ''
}

/** Search iTunes for album artwork by track name + artist. Returns image URL or null. */
export async function fetchAlbumArt(trackName, artistName) {
  const term = encodeURIComponent(`${trackName} ${artistName}`)

  // Try iTunes first
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=3`
    const res = await fetch(itunesUrl)
    if (res.ok) {
      const json = await res.json()
      if (json?.results?.length) {
        console.log(`[lastfm] iTunes art for "${trackName}" by "${artistName}": ${json.results.length} result(s)`)
        // Prefer exact artist match; fall back to first result
        const hit = json.results.find(r => r.artistName === artistName) ?? json.results[0]
        const url100 = hit?.artworkUrl100 || hit?.artworkUrl60
        if (url100) {
          // Use the URL as-is — Apple CDN URLs already include a size suffix (e.g. /100x100bb.jpg).
          // The iTunes Search API provides images at their best available resolution;
          // requesting larger sizes returns 404 since the original upload may not be that big.
          console.log(`[lastfm]   → ${url100}`)
          return url100
        }
      }
    }
  } catch (err) {
    console.warn(`[lastfm] iTunes art fetch failed for "${trackName}":`, err.message)
  }

  // Fallback: try Last.fm album search API for the artwork URL
  if (artistName && trackName) {
    const lfUrl = `${BASE}?method=album.search&format=json&api_key=${import.meta.env.VITE_LASTFM_API_KEY || ''}&album=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}`
    try {
      const res = await fetch(lfUrl)
      if (res.ok) {
        const json = await res.json()
        const matches = json?.albummatches?.album
        if (Array.isArray(matches) && matches.length) {
          // Use the album image from Last.fm search results
          for (const a of matches) {
            if (a?.image) {
              const art = pickImg(a.image)
              if (art) {
                console.log(`[lastfm]   → fallback via Last.fm search: ${art}`)
                return art
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[lastfm] Last.fm album search failed for "${trackName}":`, err.message)
    }
  }

  console.log(`[lastfm] No album art found for "${trackName}" by "${artistName}"`)
  return null
}

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
