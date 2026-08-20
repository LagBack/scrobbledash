# ScrobbleDash

ScrobbleDash is a personal dashboard for visualizing your Last.fm listening stats. Instead of digging through Last.fm's own pages, you get a clean, dark-themed space that shows your recent scrobbles, top artists, and listening habits at a glance.

## Status
> [!WARNING]
> This project is currently in **beta**. Core features are working, but you might run into bugs, rough edges, or things that behave unexpectedly. Feedback and bug reports are welcome.

## Features

- Dashboard view of your Last.fm listening activity
- Recent tracks displayed in a coverflow-style carousel
- Dark theme with red accent colors
- Smooth, animated UI built with React components from [reactbits.dev](https://reactbits.dev)

## Tech Stack

- React
- reactbits.dev components for UI animations and effects

## Getting Started

```bash
# Clone the repository
git clone https://github.com/LagBack/scrobbledash.git
cd scrobbledash

# Install dependencies
npm install

# Run locally
npm run dev
```

You'll need a Last.fm API key to connect the dashboard to your own listening data. Create a .env.local with "VITE_LASTFM_API_KEY={yourkey}"
## Known Limitations

Since this is still in active beta development, expect:

- Occasional visual glitches, especially around animations
- Image fetching issues
- Limited testing across browsers and devices

## Contributing

Since this is a personal project still taking shape, contributions aren't formally structured yet, but feel free to open an issue or make a pull request if you spot a bug or have a suggestion, just keep in mind i might not tend to it immediately.

## License

MIT
