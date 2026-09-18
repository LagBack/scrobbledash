
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
      console.log(`[lastfm] track.getInfo → "${album.title}" art: ${images ? 'yes' : 'no'}`)
      return { title: album.title, image: images }
    }
  } catch (err) {
    console.warn(`[lastfm] track.getInfo failed for "${trackTitle}":`, err.message)
  }
  return null
}

export async function fetchArtistImage(artistName) {
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`
    const res = await fetch(wikiUrl)
    if (res.ok) {
      const json = await res.json()
      if (json?.thumbnail?.source) {
        const origUrl = json.thumbnail.source.replace('/320-', '/1000-')
        return origUrl
      }
    }
  } catch (err) {
    console.warn(`[lastfm] Wiki search failed for "${artistName}":`, err.message)
  }

  if (artistName && artistName.length > 2) {
    try {
      const rawUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(artistName)}&prop=images&format=json&origin=*`
      const res = await fetch(rawUrl)
      if (res.ok) {
        const json = await res.json()
        const pages = json?.query?.pages
        if (pages) {
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


export async function fetchRecentTracks(username, { from, to } = {}) {
  const tracks = []
  let page = 1

  while (true) {
    let url = get('user.getRecentTracks') + `&user=${encodeURIComponent(username)}&limit=200&page=${page}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`

    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const json = await res.json()
      const recenttracks = json?.recenttracks?.track
      if (!Array.isArray(recenttracks)) return null

      tracks.push(...recenttracks)
      const totalPages = Number(json?.recenttracks?.['@attr']?.totalPages) || page
      const hasMorePages = page < totalPages || recenttracks.length === 200
      if (!hasMorePages || recenttracks.length === 0) return tracks
      page += 1
    } catch {
      return null
    }
  }
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
