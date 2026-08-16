import { useState, useEffect, useCallback } from 'react'
import {
  fetchUserInfo,
  fetchTopTracks,
  fetchRecentTracks,
  fetchTopAlbums,
  fetchTopArtists,
  fetchArtistTags,
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

/** Pick the largest image URL from a Last.fm image array. */
function pickImg(arr) {
  if (!arr || typeof arr === 'string') return ''
  if (Array.isArray(arr)) {
    // last.fm images are ordered small → medium → large → extralarge
    for (let i = arr.length - 1; i >= 0; i--) {
      const entry = arr[i]
      const url = typeof entry === 'string' ? entry : (entry?.['#text'] ?? '')
      if (url && (url.startsWith('http') || url.startsWith('//'))) return url.startsWith('//') ? `https:${url}` : url
    }
  }
  // single object without '#text'? Try .href or .src
  if (typeof arr === 'object') {
    const url = arr.url ?? arr.src ?? arr.href ?? ''
    if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('//'))) {
      return url.startsWith('//') ? `https:${url}` : url
    }
  }
  return ''
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

    // Recently played: prefer recenttracks, fall back to topTracks for images
    const recentlyPlayed = recentData?.length
      ? recentData.slice(0, 12).map(t => ({
          image: pickImg(t.album?.image) || PLACEHOLDER,
          text: t.name,
        }))
      : (tracksData?.tracks ? normalizeTopTracks(tracksData) : [])

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

    // Most played track
    let mostPlayedTrack = { ...mockMostPlayedTrack }
    if (tracksData?.tracks?.[0]) {
      const t = tracksData.tracks[0]
      mostPlayedTrack = {
        track: t.name,
        artist: t.artist?.name ?? '',
        album: t.album?.title ?? '',
        cover: pickImg(t.album?.image) || PLACEHOLDER,
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

    console.log('[lastfm] recentlyPlayed images:', recentlyPlayed.length, 'valid validImgUrls:', recentlyPlayed.filter(p => isValidImgUrl(p.image)).length)
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
