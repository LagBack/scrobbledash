const BASE = 'https://ws.audioscrobbler.com/2.0'
const LIMIT = 50

function get(key) {
  const params = new URLSearchParams({ method: key, format: 'json' })
  const apiKey = import.meta.env.VITE_LASTFM_API_KEY
  if (apiKey) params.set('api_key', apiKey)
  return `${BASE}?${params.toString()}`
}

export function img(arr) {
  if (!Array.isArray(arr)) return ''
  const best = arr[arr.length - 1]
  return typeof best === 'string' ? best : (best?.['#text'] ?? '')
}


const NOIMAGE_ID = '2a96cbd8b46e442fc41c2b86b821562f.png'

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

const imageResultCache = new Map();
const pendingImageRequests = new Map();

function normalizeForImage(name) {
  return (name || '').trim().toLowerCase()
}

function isLikelyArtistDescription(description) {
  const text = normalizeForImage(description)
  return (
    text.includes('band') ||
    text.includes('musician') ||
    text.includes('singer') ||
    text.includes('rapper') ||
    text.includes('dj') ||
    text.includes('artist') ||
    text.includes('composer') ||
    text.includes('songwriter') ||
    text.includes('duo') ||
    text.includes('group')
  )
}

async function fetchArtistImageFromWikidata(artistName) {
  const norm = normalizeForImage(artistName)
  if (!norm) return null

  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(artistName)}&language=en&type=item&limit=10&format=json&origin=*`
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) return null
    const json = await res.json()
    const candidates = Array.isArray(json?.search) ? json.search : []
    const exactMatches = candidates.filter(item => normalizeForImage(item.label) === norm)
    const preferred = exactMatches.filter(item => isLikelyArtistDescription(item.description))
    const shortlist = preferred.length ? preferred : exactMatches

    for (const item of shortlist) {
      if (!item?.id) continue
      const entityRes = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(item.id)}.json`)
      if (!entityRes.ok) continue
      const entityJson = await entityRes.json()
      const entity = entityJson?.entities?.[item.id]
      const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
      const fileName = typeof p18 === 'string' ? p18 : (p18?.['#text'] ?? '')
      if (fileName) {
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`
      }
    }
  } catch {
  }

  return null
}

async function fetchArtistImageFromLastFm(artistName) {
  const apiKey = import.meta.env.VITE_LASTFM_API_KEY
  if (!apiKey) return null
  let artistMbid = ''

  const infoUrl = `${BASE}?method=artist.getInfo&format=json&api_key=${encodeURIComponent(apiKey)}&artist=${encodeURIComponent(artistName)}`
  try {
    const infoRes = await fetch(infoUrl)
    if (infoRes.ok) {
      const infoJson = await infoRes.json()
      const resolvedName = normalizeForImage(infoJson?.artist?.name)
      if (resolvedName === normalizeForImage(artistName)) {
        artistMbid = infoJson?.artist?.mbid || ''
        const artistImage = pickImg(infoJson?.artist?.image)
        if (artistImage) return artistImage
      }
    }
  } catch {
  }

  const searchUrl = `${BASE}?method=album.search&format=json&limit=10&api_key=${encodeURIComponent(apiKey)}&album=${encodeURIComponent(artistName)}`
  try {
    const searchRes = await fetch(searchUrl)
    if (searchRes.ok) {
      const searchJson = await searchRes.json()
      const exactAlbums = (searchJson?.results?.albummatches?.album ?? [])
        .filter(album => normalizeForImage(album?.artist) === normalizeForImage(artistName))
      for (const album of exactAlbums) {
        const albumImage = pickImg(album?.image)
        if (albumImage) return albumImage
      }
    }
  } catch {
  }

  const albumsUrl = `${BASE}?method=artist.getTopAlbums&format=json&limit=5&api_key=${encodeURIComponent(apiKey)}&artist=${encodeURIComponent(artistName)}${artistMbid ? `&mbid=${encodeURIComponent(artistMbid)}` : ''}`
  try {
    const albumsRes = await fetch(albumsUrl)
    if (!albumsRes.ok) return null
    const albumsJson = await albumsRes.json()
    const resolvedName = normalizeForImage(albumsJson?.topalbums?.['@attr']?.artist)
    if (resolvedName && resolvedName !== normalizeForImage(artistName)) return null

    for (const album of albumsJson?.topalbums?.album ?? []) {
      const albumImage = pickImg(album?.image)
      if (albumImage) return albumImage
    }
  } catch {
  }

  return null
}

export async function fetchArtistImage(artistName) {
  const norm = normalizeForImage(artistName);
  if (!norm || norm.length < 2) return null;

  const cached = imageResultCache.get(norm);
  if (cached === '__MISSING__') return null;
  if (cached) return cached;

  if (pendingImageRequests.has(norm)) {
    return pendingImageRequests.get(norm);
  }

  const fetchAndCache = async () => {
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`;
      const res = await fetch(wikiUrl);
      if (res.ok) {
        const json = await res.json();
        if (json?.thumbnail?.source) {
          const origUrl = json.thumbnail.source.replace('/320-', '/1000-');
          imageResultCache.set(norm, origUrl);
          return origUrl;
        }
      }
    } catch {
    }

    const lastFmImg = await fetchArtistImageFromLastFm(artistName);
    if (lastFmImg) {
      imageResultCache.set(norm, lastFmImg);
      return lastFmImg;
    }

    const wikidataImg = await fetchArtistImageFromWikidata(artistName);
    if (wikidataImg) {
      imageResultCache.set(norm, wikidataImg);
      return wikidataImg;
    }

    imageResultCache.set(norm, '__MISSING__');
    return null;
  };

  const promise = fetchAndCache().finally(() => {
    pendingImageRequests.delete(norm);
  });
  pendingImageRequests.set(norm, promise);
  return promise;
}

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
      scrobbles: parseInt(user.playcount ?? user.stats?.scrobbles, 10) || 0,
    }
  } catch {
    return null
  }
}

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

const MAX_RECENT_TRACK_PAGES = 30; // Maximum pages to fetch (6000 tracks)
const MAX_RECENT_TRACKS = 6000;

export async function fetchRecentTracks(username, { from, to } = {}) {
  const tracks = [];
  let page = 1;

  while (tracks.length < MAX_RECENT_TRACKS && page <= MAX_RECENT_TRACK_PAGES) {
    let url = get('user.getRecentTracks') + `&user=${encodeURIComponent(username)}&limit=200&page=${page}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return tracks.length ? tracks : null;
      const json = await res.json();
      const recenttracks = json?.recenttracks?.track;
      if (!Array.isArray(recenttracks)) return tracks.length ? tracks : null;

      tracks.push(...recenttracks);
      const totalPages = Number(json?.recenttracks?.['@attr']?.totalPages) || page;
      if (page >= totalPages || recenttracks.length < 200 || tracks.length >= MAX_RECENT_TRACKS) return tracks;
      page += 1;
    } catch {
      return tracks.length ? tracks : null;
    }
  }

  return tracks;
}

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

function makePlaceholder(trackName) {
  let hash = 0
  for (let i = 0; i < (trackName || '').length; i++) {
    hash = trackName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 40 + Math.abs(hash >> 8)) % 360

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


function isValidImgUrl(url) {
  return typeof url === 'string' && url.length > 10 && (url.startsWith('http://') || url.startsWith('https://'))
}

function normalizeTopTracks(topTracksResp) {
  if (!topTracksResp?.tracks) return []
  return topTracksResp.tracks
    .map(t => ({
      image: pickImg(t.album?.image) || makePlaceholder(t.name),
      text: t.name,
    }))
}

function normalizeTopAlbums(albumsResp) {
  if (!Array.isArray(albumsResp)) return []
  return albumsResp.map(a => ({
    image: pickImg(a.image) || makePlaceholder(`${a.artist?.name ?? 'Unknown'} — ${a.name ?? 'Unknown Album'}`),
    title: `${a.artist?.name ?? 'Unknown Artist'} — ${a.name ?? 'Unknown Album'}`,
  }))
}


function normalizeTopArtists(artistsResp) {
  if (!Array.isArray(artistsResp)) return []
  return artistsResp.map(a => ({
    name: a.name,
    plays: parseInt(a.playcount, 10) || 0,
    image: pickImg(a.image) || makePlaceholder(a.name),
  }))
}

const GENRE_REQUEST_LIMIT = 20;

const artistTagCache = new Map();

const pendingGenreRequests = new Map();

async function analyzeGenres(artistNames) {
  if (!artistNames.length) return null;

  const genreCounts = new Map();
  const fetched = await Promise.allSettled(
    artistNames.slice(0, GENRE_REQUEST_LIMIT).map(async (name) => {
      if (artistTagCache.has(name)) return artistTagCache.get(name);
      if (pendingGenreRequests.has(name)) return pendingGenreRequests.get(name);
      const promise = fetchArtistTags(name).then((tags) => {
        if (tags) artistTagCache.set(name, tags);
        pendingGenreRequests.delete(name);
        return tags;
      });
      pendingGenreRequests.set(name, promise);
      return promise;
    }),
  );

  for (const result of fetched) {
    if (result.status === 'fulfilled' && result.value) {
      for (const tag of result.value) {
        genreCounts.set(tag, (genreCounts.get(tag) || 0) + 1);
      }
    }
  }

  let topGenre = null;
  let maxCount = 0;
  for (const [genre, count] of genreCounts) {
    if (genre === 'last.fm') continue;
    if (count > maxCount) {
      maxCount = count;
      topGenre = genre;
    }
  }
  return topGenre || null;
}

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

    const thisFetch = ++currentFetchRef.current

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

    if (currentFetchRef.current !== thisFetch) return

    const infoData = info.status === 'fulfilled' ? info.value : null
    const tracksData = topTracks.status === 'fulfilled' ? topTracks.value : null
    const recentData = recentTracks.status === 'fulfilled' ? recentTracks.value : null
    const albumsData = topAlbumsResp.status === 'fulfilled' ? topAlbumsResp.value : null
    const artistsData = topArtistsResp.status === 'fulfilled' ? topArtistsResp.value : null

    const effectiveUser = infoData?.name || user
    const infoScrobbles = infoData != null && infoData.scrobbles != null ? parseInt(infoData.scrobbles, 10) : NaN
    const tracksScrobbles = tracksData?.totalScrobbles != null ? parseInt(tracksData.totalScrobbles, 10) : NaN

    const effectiveTotalScrobbles =
      (infoScrobbles && infoScrobbles > 0) ? infoScrobbles :
      (!isNaN(tracksScrobbles) && tracksScrobbles > 0) ? tracksScrobbles :
      mockTotalScrobbles

    let recentlyPlayed = []
    if (recentData?.length) {
      recentlyPlayed = recentData.slice(0, 12).map(t => ({ text: t.name }))
    } else if (tracksData?.tracks) {
      recentlyPlayed = normalizeTopTracks(tracksData)
    }

    const topAlbums = normalizeTopAlbums(albumsData) || []

    let listeningByHour = [...mockListeningByHour]
    let listeningByWeekday = [...mockListeningByWeekday]
    if (recentData?.length) {
      const { hourCounts, dayCounts } = computePatterns(recentData)
      listeningByHour = hourCounts
      listeningByWeekday = dayCounts
    }

    const rawArtists = normalizeTopArtists(artistsData) || []
    const topArtistsCapped = rawArtists.slice(0, 5)

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

    let mostPlayedTrack = { ...mockMostPlayedTrack }

    if (tracksData?.tracks?.[0]) {
      const t = tracksData.tracks[0]

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
        }
      }

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

    if (!infoData && !tracksData && !recentTracks) {
      setError("Couldn't fetch your stats. Please check that your Last.fm username is correct and try again.")
    }

    setLoading(false)
  }, [hasApiKey]); // hasApiKey is compile-time constant; kept for eslint exhaustive-deps compliance

  useEffect(() => {
    if (username) fetchData(username)
  }, [username, fetchData])

  return { data, loading, error, refetch: () => fetchData(username) }
}
