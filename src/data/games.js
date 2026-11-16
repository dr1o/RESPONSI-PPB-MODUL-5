const GAMES_LOCAL = [
  {
    id: 'local-1',
    title: 'Hollow Knight',
    platform: 'PC',
    genre: 'Metroidvania',
    status: 'Completed',
    release_year: 2017,
    hours_played: 46.5,
    rating: 5,
    cover_url: '/covers/pc.svg',
    description:
      'Atmospheric 2D action-adventure set in the fallen insect kingdom of Hallownest.',
    specs: [
      { id: 'spec-0', name: 'Developer', quantity: 'Team Cherry' },
      { id: 'spec-1', name: 'Edition', quantity: 'Voidheart' },
      { id: 'spec-2', name: 'Mode', quantity: 'Single-player' },
    ],
    notes: [
      'Unlock Mantis Claw in Fungal Wastes',
      'Collect 1800 Essence for Awoken Dream Nail',
      'Defeat The Hollow Knight',
    ],
  },
  {
    id: 'local-2',
    title: 'Elden Ring',
    platform: 'PS5',
    genre: 'Action RPG',
    status: 'Playing',
    release_year: 2022,
    hours_played: 78.0,
    rating: 5,
    cover_url: '/covers/console.svg',
    description:
      'Open-world dark fantasy action RPG across the Lands Between.',
    specs: [
      { id: 'spec-0', name: 'Developer', quantity: 'FromSoftware' },
      { id: 'spec-1', name: 'Build', quantity: 'Dex/Faith' },
      { id: 'spec-2', name: 'Mode', quantity: 'Single-player / Co-op' },
    ],
    notes: [
      'Clear Stormveil Castle',
      'Explore Liurnia of the Lakes',
      'Prepare for Leyndell Royal Capital',
    ],
  },
  {
    id: 'local-3',
    title: 'Hades',
    platform: 'Switch',
    genre: 'Roguelike',
    status: 'Completed',
    release_year: 2020,
    hours_played: 34.0,
    rating: 5,
    cover_url: '/covers/handheld.svg',
    description:
      'Fast-paced hack-and-slash dungeon crawler fighting out of the Underworld.',
    specs: [
      { id: 'spec-0', name: 'Developer', quantity: 'Supergiant Games' },
      { id: 'spec-1', name: 'Weapon', quantity: 'Twin Fists' },
      { id: 'spec-2', name: 'Heat', quantity: '8' },
    ],
    notes: [
      'Reach the surface 10 times for main ending',
      'Max out Keepsake bonds',
    ],
  },
  {
    id: 'local-4',
    title: 'Chrono Trigger',
    platform: 'Retro',
    genre: 'JRPG',
    status: 'Backlog',
    release_year: 1995,
    hours_played: 2.5,
    rating: 4,
    cover_url: '/covers/retro.svg',
    description:
      'Classic time-traveling JRPG across eras from 65,000,000 BC to 2300 AD.',
    specs: [
      { id: 'spec-0', name: 'Platform', quantity: 'SNES' },
      { id: 'spec-1', name: 'Developer', quantity: 'Square' },
      { id: 'spec-2', name: 'Mode', quantity: 'Single-player' },
    ],
    notes: [
      'Trigger Millennial Fair opening',
      'Travel to 600 AD Middle Ages',
    ],
  },
]

export default GAMES_LOCAL
