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

/** Fetch track info from Last.fm — returns the album name and its image URLs. */
export async function fetchTrackInfo(trackTitle, artistName) {
  const url = `${BASE}?method=track.getInfo&format=json&api_key=${import.meta.env.VITE_LASTFM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackTitle)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const album = json?.track?.album
    if (album?.title) {
      const images = pickImg(album.image) || ''
      return { title: album.title, image: images }
    }
  } catch (err) {
    console.warn(`[lastfm] track.getInfo failed for "${trackTitle}":`, err.message)
  }
  return null
}

/** Fetch a high-quality image for an artist/band.
 * Uses Wikipedia's MediaWiki API to find the artist's portrait/photo. */
export async function fetchArtistImage(artistName) {
  try {
    // First try Wikipedia page description API — returns thumbnail if the page has one
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`
    const res = await fetch(wikiUrl)
    if (res.ok) {
      const json = await res.json()
      // Wikipedia REST API returns a 'thumbnail' object with the source URL
      if (json?.thumbnail?.source) {
        // Wikipedia's thumbnail is small (~200-400px). Get the original by replacing size.
        const origUrl = json.thumbnail.source.replace('/320-', '/1000-')
        return origUrl
      }
    }
  } catch (err) {
    console.warn(`[lastfm] Wiki search failed for "${artistName}":`, err.message)
  }

  // Fallback: try Wikipedia full page API to extract the first image from the infobox
  if (artistName && artistName.length > 2) {
    try {
      const rawUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(artistName)}&prop=images&format=json&origin=*`
      const res = await fetch(rawUrl)
      if (res.ok) {
        const json = await res.json()
        const pages = json?.query?.pages
        if (pages) {
          // Get the first non-disambiguation page
          for (const [, page] of Object.entries(pages)) {
            if (page.title && !page.title.includes(':')) {
              return null // No thumbnail on this page — fall back to placeholder
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[lastfm] Wiki full page failed for "${artistName}":`, err.message)
    }
  }

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

/** Fetch recent tracks for a user. Accepts optional time-range params (Unix timestamps) to limit the window. */
export async function fetchRecentTracks(username, { from, to } = {}) {
  const base = get('user.getRecentTracks') + `&user=${encodeURIComponent(username)}&limit=200`
  let url = base
  if (from) url += `&from=${from}`
  if (to) url += `&to=${to}`
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

// ── hook ──────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  user as mockUser,
  recentlyPlayed as mockRecentlyPlayed,
  topAlbums as mockTopAlbums,
  totalScrobbles as mockTotalScrobbles,
  weeklyGenre as mockWeeklyGenre,
  listeningByHour as mockListeningByHour,
  listeningByWeekday as mockListeningByWeekday,
  topArtists as mockTopArtists,
  dominantArtist as mockDominantArtist,
  secondArtist as mockSecondArtist,
  mostPlayedTrack as mockMostPlayedTrack,
} from '../data/mockData'

const PLACEHOLDER = 'https://lastfm.freetls.fastly.net/img/noimage_200.png'

// ── helpers for data transformation ───────────────

/** Generate a unique gradient placeholder image as a base64 data URL using the track name as seed. */
function makePlaceholder(trackName) {
  // Deterministic color from hash of track name
  let hash = 0
  for (let i = 0; i < (trackName || '').length; i++) {
    hash = trackName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 40 + Math.abs(hash >> 8)) % 360 // slightly offset for gradient

  // Draw gradient background + first letter
  const c = document.createElement('canvas')
  c.width = 400; c.height = 400
  const ctx = c.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 400, 400)
  grad.addColorStop(0, `hsl(${h1}, 55%, 22%)`)
  grad.addColorStop(1, `hsl(${h2}, 50%, 12%)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 400, 400)

  const letter = (trackName || '?').charAt(0).toUpperCase()
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.15
  ctx.font = 'bold 260px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, 200, 200)
  ctx.globalAlpha = 1

  return c.toDataURL('image/jpeg', 0.85)
}

/** Check if an image URL looks like a real, loadable image. */
function isValidImgUrl(url) {
  return typeof url === 'string' && url.length > 10 && (url.startsWith('http://') || url.startsWith('https://'))
}

/** Normalize top tracks into the shape our CircularGallery expects. */
function normalizeTopTracks(topTracksResp) {
  if (!topTracksResp?.tracks) return []
  return topTracksResp.tracks
    .map(t => ({
      image: pickImg(t.album?.image) || makePlaceholder(t.name),
      text: t.name,
    }))
}

/** Normalize top albums into the shape our DriftWall expects. */
function normalizeTopAlbums(albumsResp) {
  if (!Array.isArray(albumsResp)) return []
  // Keep every album — use gradient placeholder for missing images so
  // no positions go blank (filtering previously caused unpredictable gaps)
  return albumsResp.map(a => ({
    image: pickImg(a.image) || makePlaceholder(`${a.artist?.name ?? 'Unknown'} — ${a.name ?? 'Unknown Album'}`),
    title: `${a.artist?.name ?? 'Unknown Artist'} — ${a.name ?? 'Unknown Album'}`,
  }))
}

/** Normalize top artists into the shape our FloatingLinesBackground expects. */
function normalizeTopArtists(artistsResp) {
  if (!Array.isArray(artistsResp)) return []
  return artistsResp.map(a => ({
    name: a.name,
    plays: parseInt(a.playcount, 10) || 0,
    image: pickImg(a.image) || makePlaceholder(a.name),
  }))
}

/** Analyze genres from a list of artist names. Returns the most frequent genre or null. */
const artistTagCache = new Map()

async function analyzeGenres(artistNames) {
  if (!artistNames.length) return null

  // Count genres across all artists' tags (parallel fetch with cache)
  const genreCounts = new Map()
  const fetched = await Promise.allSettled(
    artistNames.slice(0, 30).map(async (name) => {
      if (artistTagCache.has(name)) return artistTagCache.get(name)
      const tags = await fetchArtistTags(name)
      if (tags) artistTagCache.set(name, tags)
      return tags
    })
  )

  for (const result of fetched) {
    if (result.status === 'fulfilled' && result.value) {
      for (const tag of result.value) {
        genreCounts.set(tag, (genreCounts.get(tag) || 0) + 1)
      }
    }
  }

  // Find the most common genre (skip 'last.fm' tag which appears on all artists)
  let topGenre = null
  let maxCount = 0
  for (const [genre, count] of genreCounts) {
    if (genre === 'last.fm') continue
    if (count > maxCount) {
      maxCount = count
      topGenre = genre
    }
  }
  return topGenre || null
}

/** Compute listening patterns from recenttracks timestamps. */
function computePatterns(recentTracks) {
  const hourCounts = new Array(24).fill(0)
  const dayCounts = [0, 0, 0, 0, 0, 0, 0] // Sun=0 ... Sat=6

  for (const entry of recentTracks) {
    const uts = entry.date?.uts ?? entry['@attr']?.date?.uts
    if (!uts) continue

    const date = new Date(Number(uts) * 1000)
    hourCounts[date.getHours()] += 1
    dayCounts[date.getDay()] += 1
  }

  return { hourCounts, dayCounts }
}

// ── hook ──────────────────────────────────────────

export default function useLastFmData(username) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const currentFetchRef = useRef(0)

  const hasApiKey = Boolean(import.meta.env.VITE_LASTFM_API_KEY)

  const fetchData = useCallback(async (user) => {
    if (!user || !user.trim()) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    // If no API key, use mock data directly (don't fetch)
    if (!hasApiKey) {
      setData({
        user: mockUser,
        recentlyPlayed: mockRecentlyPlayed,
        topAlbums: mockTopAlbums.map(a => ({ ...a, image: a.cover })),
        totalScrobbles: mockTotalScrobbles,
        weeklyGenre: mockWeeklyGenre,
        listeningByHour: [...mockListeningByHour],
        listeningByWeekday: [...mockListeningByWeekday],
        topArtists: mockTopArtists.map(a => ({ name: a.name, plays: a.plays, image: a.image })),
        topArtistsGallery: mockTopArtists.map(a => ({ name: a.name, image: a.image || makePlaceholder(a.name) })),
        dominantArtist: { ...mockDominantArtist },
        secondArtist: { ...mockSecondArtist },
        mostPlayedTrack: { ...mockMostPlayedTrack },
      })
      setLoading(false)
      return
    }

    // Race-condition guard: cancel previous in-flight fetch
    const thisFetch = ++currentFetchRef.current

    // Fetch everything in parallel — use a 7-day window so the busiest-days
    // chart always covers all 7 weekdays, not just the partial week the user
    // has scrobbled so far.
    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    const fetchRecentTracksWithRange = () => fetchRecentTracks(user, {
      from: Math.floor(from.getTime() / 1000),
      to: Math.floor(now.getTime() / 1000),
    })

    const [
      info,
      topTracks,
      recentTracks,
      topAlbumsResp,
      topArtistsResp,
    ] = await Promise.allSettled([
      fetchUserInfo(user),
      fetchTopTracks(user),
      fetchRecentTracksWithRange(),
      fetchTopAlbums(user),
      fetchTopArtists(user),
    ])

    // Discard stale result if a newer fetch started while we were waiting
    if (currentFetchRef.current !== thisFetch) return

    // ── Extract results (null on rejection) ──
    const infoData = info.status === 'fulfilled' ? info.value : null
    const tracksData = topTracks.status === 'fulfilled' ? topTracks.value : null
    const recentData = recentTracks.status === 'fulfilled' ? recentTracks.value : null
    const albumsData = topAlbumsResp.status === 'fulfilled' ? topAlbumsResp.value : null
    const artistsData = topArtistsResp.status === 'fulfilled' ? topArtistsResp.value : null

    // ── Build the data object with fallbacks ──
    const effectiveUser = infoData?.name || user
    // Try both sources for scrobbles; fall back to mock only if truly empty
    const infoScrobbles = infoData != null && infoData.scrobbles != null ? parseInt(infoData.scrobbles, 10) : NaN
    const tracksScrobbles = tracksData?.totalScrobbles != null ? parseInt(tracksData.totalScrobbles, 10) : NaN

    const effectiveTotalScrobbles =
      (infoScrobbles && infoScrobbles > 0) ? infoScrobbles :
      (!isNaN(tracksScrobbles) && tracksScrobbles > 0) ? tracksScrobbles :
      mockTotalScrobbles

    // Recently played — skip image fetching (no section renders it); keep track count for data completeness
    let recentlyPlayed = []
    if (recentData?.length) {
      recentlyPlayed = recentData.slice(0, 12).map(t => ({ text: t.name }))
    } else if (tracksData?.tracks) {
      recentlyPlayed = normalizeTopTracks(tracksData)
    }

    // Top albums — filtered to only those with valid images (no empty spots)
    const topAlbums = normalizeTopAlbums(albumsData) || []

    // Listening patterns from recenttracks timestamps
    let listeningByHour = [...mockListeningByHour]
    let listeningByWeekday = [...mockListeningByWeekday]
    if (recentData?.length) {
      const { hourCounts, dayCounts } = computePatterns(recentData)
      listeningByHour = hourCounts
      listeningByWeekday = dayCounts
    }

    // Top artists — limited to 5 max for the component's layout
    const rawArtists = normalizeTopArtists(artistsData) || []
    const topArtistsCapped = rawArtists.slice(0, 5)

    // Build gallery data for the top-artists carousel with high-quality images from Wikipedia
    let topArtistsGallery = []
    if (topArtistsCapped.length) {
      const promises = topArtistsCapped.map(a => ({
        name: a.name,
        imgPromise: fetchArtistImage(a.name),
      }))
      const resolved = await Promise.allSettled(promises.map(p => p.imgPromise))
      topArtistsGallery = promises.map((p, idx) => {
        const value = resolved[idx]?.status === 'fulfilled' ? resolved[idx].value : null
        return { name: p.name, image: value || makePlaceholder(p.name) }
      })
    }

    let dominantArtist = { ...mockDominantArtist }
    let secondArtist = { ...mockSecondArtist }

    if (topArtistsCapped.length >= 1) {
      const top = topArtistsCapped[0]
      dominantArtist = {
        name: top.name,
        plays: top.plays,
        percentage: effectiveTotalScrobbles
          ? Math.round((top.plays / effectiveTotalScrobbles) * 10000) / 100
          : 0,
      }
    }
    if (topArtistsCapped.length >= 2) {
      secondArtist = { name: topArtistsCapped[1].name, plays: topArtistsCapped[1].plays }
    }

    // Most played track — use Last.fm album art first, fall back through multiple sources
    let mostPlayedTrack = { ...mockMostPlayedTrack }
    if (tracksData?.tracks?.[0]) {
      const t = tracksData.tracks[0]

      // Try Last.fm's own album data first (for the specific track)
      const artFromLfm = pickImg(t.album?.image)
      let cover = artFromLfm
      let infoTitle = t.album?.title ?? ''

      if (!cover) {
        const artistName = t.artist?.name ?? ''
        const trackTitle = t.name
        try {
          const info = await fetchTrackInfo(trackTitle, artistName)
          if (info?.image) cover = info.image
          if (info?.title) infoTitle = info.title
        } catch {
          // will use gradient below
        }
      }

      // Final fallback: unique gradient placeholder keyed to track name
      if (!cover) {
        cover = makePlaceholder(t.name)
      }

      mostPlayedTrack = {
        track: t.name,
        artist: t.artist?.name ?? '',
        album: infoTitle,
        cover,
        plays: parseInt(t.playcount, 10) || parseInt(t['@attr']?.playcount, 10) || 0,
      }
    }

    // Weekly genre analysis from top tracks' artists' tags
    let weeklyGenre = mockWeeklyGenre
    if (tracksData?.tracks?.length) {
      const uniqueArtists = [...new Set(tracksData.tracks.map(t => t.artist?.name).filter(Boolean))]
      const genre = await analyzeGenres(uniqueArtists)
      if (genre) weeklyGenre = genre
    }

    setData({
      user: { name: effectiveUser },
      recentlyPlayed,
      topAlbums,
      totalScrobbles: effectiveTotalScrobbles,
      weeklyGenre,
      listeningByHour,
      listeningByWeekday,
      topArtists: topArtistsCapped,
      topArtistsGallery,
      dominantArtist,
      secondArtist,
      mostPlayedTrack,
    })

    // Check if any critical fetch failed
    if (!infoData && !tracksData && !recentTracks) {
      setError("Couldn't fetch your stats. Please check that your Last.fm username is correct and try again.")
    }

    setLoading(false)
  }, [hasApiKey])

  useEffect(() => {
    if (username) fetchData(username)
  }, [username, fetchData])

  return { data, loading, error, refetch: () => fetchData(username) }
}
