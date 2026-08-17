import { useState, useEffect, useCallback } from 'react'
import {
  fetchUserInfo,
  fetchTopTracks,
  fetchRecentTracks,
  fetchTopAlbums,
  fetchTopArtists,
  fetchArtistTags,
  fetchArtistImage,
  pickImg,
  fetchTrackInfo,
} from './lastfm'
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
      image: pickImg(t.album?.image) || PLACEHOLDER,
      text: t.name,
    }))
}

/** Normalize top albums into the shape our DriftWall expects. */
function normalizeTopAlbums(albumsResp) {
  if (!Array.isArray(albumsResp)) return []
  // Filter out albums with no valid image to prevent empty spots in the gallery
  return albumsResp
    .map(a => ({
      image: pickImg(a.image) || PLACEHOLDER,
      title: `${a.artist?.name ?? ''} — ${a.name ?? ''}`,
    }))
    .filter(item => isValidImgUrl(item.image))
}

/** Normalize top artists into the shape our FloatingLinesBackground expects. */
function normalizeTopArtists(artistsResp) {
  if (!Array.isArray(artistsResp)) return []
  return artistsResp.map(a => ({
    name: a.name,
    plays: parseInt(a.playcount, 10) || 0,
    image: pickImg(a.image) || PLACEHOLDER,
  }))
}

/** Analyze genres from a list of artist names. Returns the most frequent genre or null. */
async function analyzeGenres(artistNames) {
  if (!artistNames.length) return null

  // Count genres across all artists' tags
  const genreCounts = new Map()
  for (const name of artistNames.slice(0, 30)) {
    const tags = await fetchArtistTags(name)
    if (tags) {
      for (const tag of tags) {
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
        topArtistsGallery: mockTopArtists.map(a => ({ name: a.name, image: a.image || PLACEHOLDER })),
        dominantArtist: { ...mockDominantArtist },
        secondArtist: { ...mockSecondArtist },
        mostPlayedTrack: { ...mockMostPlayedTrack },
      })
      setLoading(false)
      return
    }

    // Fetch everything in parallel
    const [
      info,
      topTracks,
      recentTracks,
      topAlbumsResp,
      topArtistsResp,
    ] = await Promise.allSettled([
      fetchUserInfo(user),
      fetchTopTracks(user),
      fetchRecentTracks(user),
      fetchTopAlbums(user),
      fetchTopArtists(user),
    ])

    // ── Extract results (null on rejection) ──
    const infoData = info.status === 'fulfilled' ? info.value : null
    const tracksData = topTracks.status === 'fulfilled' ? topTracks.value : null
    const recentData = recentTracks.status === 'fulfilled' ? recentTracks.value : null
    const albumsData = topAlbumsResp.status === 'fulfilled' ? topAlbumsResp.value : null
    const artistsData = topArtistsResp.status === 'fulfilled' ? topArtistsResp.value : null

    console.log('[lastfm] userInfo:', infoData)
    console.log('[lastfm] topTracks totalScrobbles:', tracksData?.totalScrobbles)
    console.log('[lastfm] recentTracks count:', recentData?.length ?? 0)
    console.log('[lastfm] albums:', albumsData?.length ?? 0, '| artists:', artistsData?.length ?? 0)

    // ── Build the data object with fallbacks ──
    const effectiveUser = infoData?.name || user
    // Try both sources for scrobbles; fall back to mock only if truly empty
    const infoScrobbles = infoData != null && infoData.scrobbles != null ? parseInt(infoData.scrobbles, 10) : NaN
    const tracksScrobbles = tracksData?.totalScrobbles != null ? parseInt(tracksData.totalScrobbles, 10) : NaN
    console.log('[lastfm] info scrobbles:', infoScrobbles, '| tracks totalScrobbles:', tracksScrobbles)

    const effectiveTotalScrobbles =
      (infoScrobbles && infoScrobbles > 0) ? infoScrobbles :
      (!isNaN(tracksScrobbles) && tracksScrobbles > 0) ? tracksScrobbles :
      mockTotalScrobbles
    console.log('[lastfm] effective totalScrobbles:', effectiveTotalScrobbles)

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
        return { name: p.name, image: value || PLACEHOLDER }
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
        console.log(`[lastfm] No album art — fetching from Last.fm: "${trackTitle}" by "${artistName}"`)
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
        console.log(`[lastfm] All lookups failed for "${t.name}" → gradient placeholder`)
        cover = makePlaceholder(t.name)
      } else {
        console.log(`[lastfm] Resolved album art for "${t.name}": ${cover.substring(0, 80)}...`, cover.startsWith('data:') ? '(gradient)' : '(URL)')
      }

      mostPlayedTrack = {
        track: t.name,
        artist: t.artist?.name ?? '',
        album: infoTitle,
        cover,
        plays: parseInt(t.playcount, 10) || parseInt(t['@attr']?.playcount, 10) || 0,
      }
    } else {
      console.log('[lastfm] mostPlayedTrack kept from mock data')
    }

    // Weekly genre analysis from top tracks' artists' tags
    let weeklyGenre = mockWeeklyGenre
    if (tracksData?.tracks?.length) {
      const uniqueArtists = [...new Set(tracksData.tracks.map(t => t.artist?.name).filter(Boolean))]
      const genre = await analyzeGenres(uniqueArtists)
      if (genre) weeklyGenre = genre
    }

    console.log('[lastfm] mostPlayedTrack cover:', mostPlayedTrack.cover?.startsWith('data:') ? '(gradient)' : mostPlayedTrack.cover)
    console.log('[lastfm] topAlbums images:', topAlbums.length)

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
