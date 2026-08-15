export const totalScrobbles = 90210
export const weeklyGenre = "midwest emo"

// Scrobbles per hour (0 = midnight, 23 = 11 PM)
export const listeningByHour = [
  3, 2, 1, 0, 0, 1, 4, 9, 14, 18, 22, 26,
  28, 24, 19, 16, 20, 26, 32, 35, 30, 22, 12, 6,
]

// Scrobbles per weekday (Sun → Sat)
export const listeningByWeekday = [38, 52, 61, 74, 68, 89, 95]

export const funStats = {
  listeningStreak: 47,
  hoursThisWeek: 38,
  newArtistsThisMonth: 23,
  mostSkippedTrack: 'Wonderwall',
  peakHour: '9 PM',
  quip: 'terminally online',
}

// Dominant artist data (calculated from total scrobbles per artist)
export const dominantArtist = {
  name: 'Radiohead',
  plays: 842,
  percentage: 0.93, // (842 / totalScrobbles * 100), rounded to 2 decimals
}

// Second-place artist for comparison
export const secondArtist = {
  name: 'Pink Floyd',
  plays: 731,
}

// Most played track
export const mostPlayedTrack = {
  track: 'Creep',
  artist: 'Radiohead',
  album: 'Pablo Honey',
  plays: 42,
  cover: 'https://upload.wikimedia.org/wikipedia/en/9/1b/Pablo_Stone.jpg',
}

// Derived ratio for comparison display
export const dominantRatio = (dominantArtist.plays / secondArtist.plays).toFixed(1) // "1.2"

export const user = {
  name: 'joaopedro',
  avatar: '',
}

export const topArtists = [
  {
    name: 'Radiohead',
    plays: 842,
    image: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Radiohead_-_OK_Computer.png',
  },
  {
    name: 'Pink Floyd',
    plays: 731,
    image: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
  },
  {
    name: 'Muse',
    plays: 618,
    image: 'https://upload.wikimedia.org/wikipedia/en/e/ea/Muse_Absolution_album_cover.jpg',
  },
  {
    name: 'Arctic Monkeys',
    plays: 554,
    image: 'https://upload.wikimedia.org/wikipedia/en/8/87/Arctic_Monkeys_-_AM.jpg',
  },
  {
    name: 'The Killers',
    plays: 497,
    image: 'https://upload.wikimedia.org/wikipedia/en/9/96/HotFuss320.jpg',
  },
]

export const recentlyPlayed = [
  {
    id: 1,
    artist: 'Radiohead',
    track: 'Creep',
    album: 'Pablo Honey',
    cover: 'https://upload.wikimedia.org/wikipedia/en/9/1b/Pablo_Stone.jpg',
    playCount: 42,
  },
  {
    id: 2,
    artist: 'Pink Floyd',
    track: 'Comfortably Numb',
    album: 'The Wall',
    cover: 'https://upload.wikimedia.org/wikipedia/en/0/0f/TheWallCover.jpg',
    playCount: 38,
  },
  {
    id: 3,
    artist: 'Muse',
    track: 'Time Is Running Out',
    album: 'Absolution',
    cover: 'https://upload.wikimedia.org/wikipedia/en/e/ea/Muse_Absolution_album_cover.jpg',
    playCount: 35,
  },
  {
    id: 4,
    artist: 'Arctic Monkeys',
    track: 'Do I Wanna Know?',
    album: 'AM',
    cover: 'https://upload.wikimedia.org/wikipedia/en/8/87/Arctic_Monkeys_-_AM.jpg',
    playCount: 31,
  },
  {
    id: 5,
    artist: 'The Killers',
    track: 'Mr. Brightside',
    album: 'Hot Fuss',
    cover: 'https://upload.wikimedia.org/wikipedia/en/9/96/HotFuss320.jpg',
    playCount: 29,
  },
  {
    id: 6,
    artist: 'Tame Impala',
    track: 'Let It Happen',
    album: 'Currents',
    cover: 'https://upload.wikimedia.org/wikipedia/en/b/bb/TameImpala_Currents.jpg',
    playCount: 27,
  },
  {
    id: 7,
    artist: 'David Bowie',
    track: 'Space Oddity',
    album: 'David Bowie (Space Oddity)',
    cover: 'https://upload.wikimedia.org/wikipedia/en/9/9f/DavidBowie_SpaceOddity.jpg',
    playCount: 25,
  },
  {
    id: 8,
    artist: 'Joy Division',
    track: 'Love Will Tear Us Apart',
    album: 'Substance',
    cover: 'https://upload.wikimedia.org/wikipedia/en/6/64/Love_Will_Tear_Us_Apart.jpg',
    playCount: 23,
  },
  {
    id: 9,
    artist: 'Oasis',
    track: 'Wonderwall',
    album: "What's the Story) Morning Glory?",
    cover: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Oasis_%28band%29_-_Wonderwall.png',
    playCount: 21,
  },
  {
    id: 10,
    artist: 'Nirvana',
    track: 'Smells Like Teen Spirit',
    album: 'Nevermind',
    cover: 'https://upload.wikimedia.org/wikipedia/en/4/4b/Nirvana_%28American_band%29_-_Nevermind_cover.jpg',
    playCount: 19,
  },
]

export const topAlbums = [
  {
    artist: 'Radiohead',
    album: 'OK Computer',
    cover: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Radiohead_-_OK_Computer.png',
  },
  {
    artist: 'Pink Floyd',
    album: 'The Dark Side of the Moon',
    cover: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
  },
  {
    artist: 'Muse',
    album: 'Absolution',
    cover: 'https://upload.wikimedia.org/wikipedia/en/e/ea/Muse_Absolution_album_cover.jpg',
  },
  {
    artist: 'Arctic Monkeys',
    album: 'AM',
    cover: 'https://upload.wikimedia.org/wikipedia/en/8/87/Arctic_Monkeys_-_AM.jpg',
  },
  {
    artist: 'The Killers',
    album: 'Hot Fuss',
    cover: 'https://upload.wikimedia.org/wikipedia/en/9/96/HotFuss320.jpg',
  },
  {
    artist: 'Tame Impala',
    album: 'Currents',
    cover: 'https://upload.wikimedia.org/wikipedia/en/b/bb/TameImpala_Currents.jpg',
  },
  {
    artist: 'David Bowie',
    album: 'The Rise and Fall of Ziggy Stardust',
    cover: 'https://upload.wikimedia.org/wikipedia/en/9/01/Bowie_-_Ziggy_Stardust.png',
  },
  {
    artist: 'Joy Division',
    album: 'Unknown Pleasures',
    cover: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Joy_Division_-_Unknown_Pleasures.jpg',
  },
  {
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    cover: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Oasis_%28band%29_-_Wonderwall.png',
  },
  {
    artist: 'Nirvana',
    album: 'Nevermind',
    cover: 'https://upload.wikimedia.org/wikipedia/en/4/4b/Nirvana_%28American_band%29_-_Nevermind_cover.jpg',
  },
  {
    artist: 'The Smashing Pumpkins',
    album: 'Mellon Collie and the Infinite Sadness',
    cover: 'https://upload.wikimedia.org/wikipedia/en/6/67/Melloncnie.jpg',
  },
  {
    artist: 'Blindside',
    album: 'The Fear of Heaven',
    cover: 'https://upload.wikimedia.org/wikipedia/en/b/b2/Blindside_-_The_Fear_of_Heaven.jpg',
  },
]
