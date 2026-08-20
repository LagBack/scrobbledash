# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19, Vite 8, Tailwind CSS 4, Three.js, OGL, framer-motion, GSAP, react-router-dom.

## Users

**Primary**: Last.fm users exploring their own scrobbling history and sharing it with others — both personal discovery and community comparison.

**Secondary**: Music enthusiasts who create shareable stats cards (Spotify-Wrapped-style) for social platforms, using their Last.fm data as the source.

## Product Purpose

ScrobbDash transforms raw Last.fm listening data into a visually striking experience. Users enter their username and get an immersive dashboard of their music habits — top artists in a 3D carousel, albums in a falling-wall animation, scrobble choreography, genre reveal, and time-based patterns — culminating in shareable PNG cards.

## Positioning

Visual artistry over data reporting. ScrobbDash is not another spreadsheet-style stats tool; it is an immersive WebGL-powered journey through your music life. The experience itself — generative backgrounds, animated galleries, dramatic reveals — is the product. Competitors show numbers; ScrobbDash shows *you* through your listening.

## Operating Context

- Users arrive via a single input screen (username entry) and are routed to their personalized dashboard (`/app?user=<name>`).
- The dashboard is entirely client-side: Last.fm API calls from the browser, no backend required.
- A card generator (PageFooter button) opens a modal for creating shareable PNG cards inspired by Spotify Wrapped.
- All visualizations are real-time rendered with WebGL or Canvas 2D — pre-rendered screenshots are not used.
- Graceful degradation: mock data is used when API key is missing or requests fail.

## Capabilities and Constraints

**Capabilities**:
- Top artists (3D circular gallery), top albums (DriftWall falling tiles), scrobble count choreography, genre reveal with animated text, listening-by-hour clock, listening-by-day bar chart, fun stats with floating lines, generative gradient waves background.
- Card generator with live preview, theme picker, custom colors, and PNG download.

**Constraints**:
- Last.fm free API: `user.getTopArtists` and `user.getTopAlbums` have no period parameter — all cards show lifetime data. `recenttracks` supports date ranges but requires separate client-side aggregation (deferred).
- No backend; all API calls are browser-based CORS requests.
- Large bundle (~1.1 MB) due to Three.js, OGL, GSAP, framer-motion dependencies.

## Brand Commitments

- **Name**: ScrobbDash (scrobble + dashboard)
- **Visual identity**: Dark theme with crimson/ red accent (`#ff2d55` / `#c1121f`) — preserve current look.
- **Voice**: Casual, lowercase ("scrobble**dash**", "here's what you've been listening to")
- **Logo**: SVG disc icon with dot — already in codebase.

## Evidence on Hand

- `src/App.jsx` — main app shell and component wiring
- `src/lib/useLastFmData.js` — data fetching hook (Last.fm API integration)
- `src/lib/cardRenderer.js` — card canvas renderer
- `src/components/CardGenerator/` — modal UI for card generation
- `package.json` — dependency manifest
- Mock data in `src/data/mockData.js` used when API key is missing

**Absences to not fabricate**: no brand guidelines, no user testimonials, no pricing/deployment info, no accessibility audit.

## Product Principles

1. **Experience first, data second** — every stat should feel like part of a performance, not a table.
2. **Preserve the incumbent system** — existing visual components are evidence and authority; refinements keep them intact unless explicitly redesigned.
3. **No backend dependency** — the entire product runs in the browser with Last.fm's free API.
4. **Shareable moments** — the card generator is a first-class feature, not an afterthought. Users should be able to export a polished PNG of their stats for social media.
5. **Graceful failure** — mock data and loading states ensure the experience is always usable, never broken.
