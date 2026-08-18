/**
 * Card renderer — draws a ScrobbDash card on an HTMLCanvasElement.
 * Returns the canvas ready for download as PNG.
 */

/* ── helpers ─────────────────────────────────────── */

function lerp(a, b, t) { return a + (b - a) * t }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/* ── image loader ────────────────────────────────── */

function loadImage(src, size = 60) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
    // timeout fallback
    setTimeout(() => resolve(null), 5000)
  })
}

function drawCircleImage(ctx, img, cx, cy, r) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  // fit image into square then center in circle
  const s = img.naturalWidth / img.naturalHeight
  let sw = r, sh = r
  if (s > 1) { sw = r * s; sh = r } else { sw = r; sh = r / s }
  ctx.drawImage(img, cx - sw / 2, cy - sh / 2, sw, sh)
  ctx.restore()
}

/* ── theme definitions ───────────────────────────── */

const THEMES = {
  crimson:   { top: '#780000', bot: '#1a0000', accent: '#ff2d55' },
  purple:    { top: '#4c1d95', bot: '#1e0a3c', accent: '#a78bfa' },
  ocean:     { top: '#0369a1', bot: '#0c1a3a', accent: '#38bdf8' },
  emerald:   { top: '#047857', bot: '#052e16', accent: '#34d399' },
  amber:     { top: '#b45309', bot: '#451a03', accent: '#fbbf24' },
  sunset:    { top: '#ea580c', bot: '#431407', accent: '#fb923c' },
  twilight:  { top: '#be185d', bot: '#3b0726', accent: '#f472b6' },
}

/* ── font loader (browser) ───────────────────────── */

const FONT_FAMILY = "'Inter','SF Pro Display','Segoe UI',system-ui,sans-serif"

function loadFonts() {
  if (document.fonts?.ready) return document.fonts.ready
  return Promise.resolve()
}

/* ── draw helpers ────────────────────────────────── */

function drawBg(ctx, w, h, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, theme.top)
  g.addColorStop(1, theme.bot)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // subtle noise overlay
  ctx.globalAlpha = 0.03
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  }
  ctx.globalAlpha = 1
}

function drawSectionDivider(ctx, x, y, w) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  ctx.restore()
}

function drawStatTile(ctx, x, y, w, h, label, value, theme) {
  // tile background
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  roundRect(ctx, x, y, w, h, 16)
  ctx.fill()

  // top accent line
  const lg = ctx.createLinearGradient(x, y, x + w, y)
  lg.addColorStop(0, 'transparent')
  lg.addColorStop(0.5, theme.accent)
  lg.addColorStop(1, 'transparent')
  ctx.fillStyle = lg
  roundRect(ctx, x, y, w, h, 16)
  ctx.fill()

  // label
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `500 18px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText(label.toUpperCase(), x + w / 2, y + 26)

  // value
  ctx.fillStyle = '#fff'
  ctx.font = `700 38px ${FONT_FAMILY}`
  ctx.fillText(value, x + w / 2, y + 72)
  ctx.restore()
}

function drawBarChart(ctx, items, x, baseY, w, barH, gap, theme) {
  const maxVal = Math.max(...items.map(i => i.value), 1)
  let cy = baseY
  items.forEach((item, i) => {
    const pct = item.value / maxVal
    // label
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `400 16px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    ctx.fillText(item.label, x, cy + barH / 2 + 5)

    // bg bar
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    roundRect(ctx, x + 140, cy, w - 160, barH, 6)
    ctx.fill()

    // filled bar
    const fg = ctx.createLinearGradient(x + 140, cy, x + 140 + (w - 160) * pct, cy)
    fg.addColorStop(0, theme.accent)
    fg.addColorStop(1, lerpColor(theme.accent, '#ffffff', 0.3))
    ctx.fillStyle = fg
    roundRect(ctx, x + 140, cy, (w - 160) * pct, barH, 6)
    ctx.fill()

    // count
    const countText = ` ${item.value}`
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `600 14px ${FONT_FAMILY}`
    ctx.textAlign = 'right'
    ctx.fillText(countText, x + w - 12, cy + barH / 2 + 5)

    cy += barH + gap
  })
}

function lerpColor(hex, to, t) {
  const r1 = parseInt(hex.slice(1, 3), 16)
  const g1 = parseInt(hex.slice(3, 5), 16)
  const b1 = parseInt(hex.slice(5, 7), 16)
  const r2 = parseInt(to.slice(1, 3), 16)
  const g2 = parseInt(to.slice(3, 5), 16)
  const b2 = parseInt(to.slice(5, 7), 16)
  const r = Math.round(lerp(r1, r2, t))
  const g = Math.round(lerp(g1, g2, t))
  const b = Math.round(lerp(b1, b2, t))
  return `rgb(${r},${g},${b})`
}

/* ── main render function ────────────────────────── */

export async function renderCard(canvas, opts) {
  const { theme = 'crimson', periodLabel = 'all time' } = opts
  const W = 1080
  const H = 1920
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  const themeObj = THEMES[theme] || THEMES.crimson
  const { user, topArtists, topTracks, topAlbums, weeklyGenre, dominantArtist, totalScrobbles, listeningByHour, listeningByWeekday } = opts

  // ── load images ────────────────────────────────
  const [avatarImg] = await Promise.all([
    user?.image ? loadImage(user.image, 80) : Promise.resolve(null),
  ])

  // ── draw bg ────────────────────────────────────
  drawBg(ctx, W, H, themeObj)

  let cy = 0

  // ── period badge ───────────────────────────────
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, W / 2 - 80, cy + 36, 160, 32, 16)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = `500 14px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText(periodLabel.toUpperCase(), W / 2, cy + 57)
  ctx.restore()
  cy += 86

  // ── user profile section ───────────────────────
  const avatarSize = 100
  if (avatarImg) {
    drawCircleImage(ctx, avatarImg, W / 2, cy + avatarSize / 2, avatarSize / 2)
  } else {
    // fallback avatar
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, cy + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = `700 36px ${FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.fillText((user?.name || '?')[0].toUpperCase(), W / 2, cy + avatarSize / 2 + 12)
    ctx.restore()
  }

  // username
  ctx.fillStyle = '#fff'
  ctx.font = `700 36px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText(user?.name || 'Unknown User', W / 2, cy + avatarSize + 48)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `400 18px ${FONT_FAMILY}`
  ctx.fillText('scrobbler', W / 2, cy + avatarSize + 76)

  cy += avatarSize + 120

  // ── scrobbles stat tile ────────────────────────
  const tileW = (W - 140) / 2
  const tileH = 120
  drawStatTile(ctx, 70, cy, tileW, tileH, 'Scrobbles', formatNum(totalScrobbles || 0), themeObj)
  if (dominantArtist?.name) {
    drawStatTile(ctx, W / 2 + 25, cy, tileW, tileH, "Top Artist", dominantArtist.name.split(' ').pop(), themeObj)
  }
  cy += tileH + 40

  // ── top 5 artists ──────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = `600 16px ${FONT_FAMILY}`
  ctx.textAlign = 'left'
  ctx.fillText('TOP 5 ARTISTS', 70, cy + 28)

  cy += 50
  const artistImgSize = 48
  topArtists?.slice(0, 5).forEach((artist, i) => {
    // rank number
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = `700 24px ${FONT_FAMILY}`
    ctx.textAlign = 'right'
    ctx.fillText(`#${i + 1}`, 110, cy + 22)

    // artist image or placeholder
    if (artist.image) {
      const img = loadImage(artist.image, artistImgSize).then(img => {
        if (img) drawCircleImage(ctx, img, 74 + artistImgSize / 2, cy + artistImgSize / 2, artistImgSize / 2)
      })
    } else {
      // placeholder circle
      ctx.beginPath()
      ctx.arc(74 + artistImgSize / 2, cy + artistImgSize / 2, artistImgSize / 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fill()
    }

    // name
    ctx.fillStyle = '#fff'
    ctx.font = `600 24px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    const displayName = artist.name.length > 28 ? artist.name.slice(0, 25) + '...' : artist.name
    ctx.fillText(displayName, 130, cy + 26)

    // plays
    if (artist.plays) {
      ctx.fillStyle = `rgba(255,255,255,${lerp(0.6, 0.25, i / 4)})`
      ctx.font = `400 16px ${FONT_FAMILY}`
      ctx.fillText(`${formatNum(artist.plays)} scrobbles`, 130, cy + 48)
    }

    // rank accent dot
    const dg = ctx.createLinearGradient(50, cy + 16, 50, cy + 56)
    dg.addColorStop(0, i === 0 ? themeObj.accent : 'transparent')
    dg.addColorStop(1, 'transparent')
    ctx.fillStyle = dg
    roundRect(ctx, 50, cy + 16, 24, 40, 12)
    ctx.fill()

    cy += 72
  })

  // ── top 5 tracks ───────────────────────────────
  cy += 30
  drawSectionDivider(ctx, 70, cy, W - 140)
  cy += 36

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = `600 16px ${FONT_FAMILY}`
  ctx.textAlign = 'left'
  ctx.fillText('TOP 5 TRACKS', 70, cy + 28)

  cy += 50
  topTracks?.slice(0, 5).forEach((track, i) => {
    const trackImgSize = 48
    // tiny rank dot
    ctx.beginPath()
    ctx.arc(60, cy + 16, 3 + (i === 0 ? 3 : 0), 0, Math.PI * 2)
    ctx.fillStyle = i === 0 ? themeObj.accent : 'rgba(255,255,255,0.15)'
    ctx.fill()

    // album art placeholder
    if (track.cover) {
      const img = loadImage(track.cover, trackImgSize).then(img => {
        if (img) {
          ctx.save()
          roundRect(ctx, 72, cy + 4, trackImgSize, trackImgSize, 10)
          ctx.fill()
          ctx.clip()
          const s = img.naturalWidth / img.naturalHeight
          let sw = trackImgSize, sh = trackImgSize
          if (s > 1) { sw = trackImgSize * s; sh = trackImgSize } else { sw = trackImgSize; sh = trackImgSize / s }
          ctx.drawImage(img, 72 - (sw - trackImgSize) / 2, cy + 4 - (sh - trackImgSize) / 2, sw, sh)
          ctx.restore()
        }
      })
    }

    // title
    ctx.fillStyle = '#fff'
    ctx.font = `600 22px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    const displayName = track.name.length > 35 ? track.name.slice(0, 32) + '...' : track.name
    ctx.fillText(displayName, 130, cy + 24)

    // artist
    ctx.fillStyle = `rgba(255,255,255,${lerp(0.6, 0.25, i / 4)})`
    ctx.font = `400 16px ${FONT_FAMILY}`
    ctx.fillText(track.artist || 'Unknown Artist', 130, cy + 48)

    cy += 72
  })

  // ── top 5 albums ───────────────────────────────
  cy += 30
  drawSectionDivider(ctx, 70, cy, W - 140)
  cy += 36

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = `600 16px ${FONT_FAMILY}`
  ctx.textAlign = 'left'
  ctx.fillText('TOP 5 ALBUMS', 70, cy + 28)

  cy += 50
  topAlbums?.slice(0, 5).forEach((album, i) => {
    // album art placeholder
    const albumArtSize = 48
    if (album.cover || album.image) {
      const imgSrc = album.cover || album.image
      const img = loadImage(imgSrc, albumArtSize).then(img => {
        if (img) {
          ctx.save()
          roundRect(ctx, 72, cy + 4, albumArtSize, albumArtSize, 10)
          ctx.fill()
          ctx.clip()
          const s = img.naturalWidth / img.naturalHeight
          let sw = albumArtSize, sh = albumArtSize
          if (s > 1) { sw = albumArtSize * s; sh = albumArtSize } else { sw = albumArtSize; sh = albumArtSize / s }
          ctx.drawImage(img, 72 - (sw - albumArtSize) / 2, cy + 4 - (sh - albumArtSize) / 2, sw, sh)
          ctx.restore()
        }
      })
    } else {
      // gradient placeholder
      const grad = ctx.createLinearGradient(72, cy + 4, 120, cy + 52)
      grad.addColorStop(0, themeObj.top)
      grad.addColorStop(1, themeObj.bot)
      ctx.fillStyle = grad
      roundRect(ctx, 72, cy + 4, albumArtSize, albumArtSize, 10)
      ctx.fill()
    }

    // title
    ctx.fillStyle = '#fff'
    ctx.font = `600 22px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    const displayName = album.title.length > 35 ? album.title.slice(0, 32) + '...' : album.title
    ctx.fillText(displayName, 130, cy + 24)

    // artist
    ctx.fillStyle = `rgba(255,255,255,${lerp(0.6, 0.25, i / 4)})`
    ctx.font = `400 16px ${FONT_FAMILY}`
    const albumArtistName = album.artist ? `${album.artist} — ${album.title}` : album.title
    ctx.fillText(albumArtistName, 130, cy + 48)

    cy += 72
  })

  // ── genre section ──────────────────────────────
  if (weeklyGenre) {
    cy += 40
    drawSectionDivider(ctx, 70, cy, W - 140)
    cy += 36

    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = `600 16px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    ctx.fillText('YOUR DOMINANT GENRE', 70, cy + 28)

    // big genre pill
    cy += 44
    const genreText = weeklyGenre
    const genreTextW = ctx.measureText(genreText).width + 60
    ctx.fillStyle = themeObj.accent
    roundRect(ctx, W / 2 - genreTextW / 2, cy, genreTextW, 56, 28)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `700 24px ${FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.fillText(genreText, W / 2, cy + 37)

    cy += 86
  }

  // ── listening patterns bar chart ───────────────
  if (listeningByWeekday?.length) {
    drawSectionDivider(ctx, 70, cy, W - 140)
    cy += 36

    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = `600 16px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    ctx.fillText('LISTENING BY DAY', 70, cy + 28)

    cy += 44
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    drawBarChart(ctx,
      dayNames.map((label, i) => ({ label, value: listeningByWeekday[i] || 0 })),
      70, cy, W - 140, 22, 8, themeObj
    )
    cy += 176
  }

  // ── footer ─────────────────────────────────────
  drawSectionDivider(ctx, 70, cy, W - 140)
  cy += 40

  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.font = `500 16px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText('generated by ScrobbDash', W / 2, cy + 28)

  // accent line at bottom
  const fg = ctx.createLinearGradient(W / 2 - 100, cy + 40, W / 2 + 100, cy + 40)
  fg.addColorStop(0, 'transparent')
  fg.addColorStop(0.5, themeObj.accent)
  fg.addColorStop(1, 'transparent')
  ctx.fillStyle = fg
  ctx.fillRect(W / 2 - 100, cy + 40, 200, 2)

  return canvas
}

function formatNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}
