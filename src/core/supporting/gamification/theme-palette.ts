import { useTheme } from '../../ui-system/theme/useTheme'
import { useMemo } from 'react'

export interface GamificationThemePalette {
  id: string
  isDark: boolean
  // Hex strings
  base: string
  mantle: string
  crust: string
  surface0: string
  surface1: string
  surface2: string
  overlay0: string
  overlay1: string
  overlay2: string
  subtext0: string
  subtext1: string
  text: string
  blue: string
  sapphire: string
  lavender: string
  sky: string
  teal: string
  green: string
  yellow: string
  peach: string
  maroon: string
  red: string
  mauve: string
  pink: string
  flamingo: string
  rosewater: string

  // Numeric hex values (for PixiJS Graphics & WebGL)
  baseNum: number
  mantleNum: number
  crustNum: number
  surface0Num: number
  surface1Num: number
  surface2Num: number
  overlay0Num: number
  overlay1Num: number
  overlay2Num: number
  subtext0Num: number
  subtext1Num: number
  textNum: number
  blueNum: number
  sapphireNum: number
  lavenderNum: number
  skyNum: number
  tealNum: number
  greenNum: number
  yellowNum: number
  peachNum: number
  maroonNum: number
  redNum: number
  mauveNum: number
  pinkNum: number
  flamingoNum: number
  rosewaterNum: number

  // Node type styles for HexGridCanvas
  colorMap: Record<string, { fill: number; stroke: number; highlight: number; icon: string; name: string }>
}

const PALETTES: Record<string, Omit<GamificationThemePalette, 'colorMap' | 'id'>> = {
  // Catppuccin Frappé (Default)
  catppuccin: {
    isDark: true,
    base: '#303446',
    mantle: '#292c3c',
    crust: '#232634',
    surface0: '#414559',
    surface1: '#51576d',
    surface2: '#626880',
    overlay0: '#737994',
    overlay1: '#838ba7',
    overlay2: '#949cbb',
    subtext0: '#a5adce',
    subtext1: '#b5bfe2',
    text: '#c6d0f5',
    blue: '#8caaee',
    sapphire: '#85c1dc',
    lavender: '#babbf1',
    sky: '#99d1db',
    teal: '#81c8be',
    green: '#a6d189',
    yellow: '#e5c890',
    peach: '#ef9f76',
    maroon: '#ea999c',
    red: '#e78284',
    mauve: '#ca9ee6',
    pink: '#f4b8e4',
    flamingo: '#eebebe',
    rosewater: '#f2d5cf',

    baseNum: 0x303446,
    mantleNum: 0x292c3c,
    crustNum: 0x232634,
    surface0Num: 0x414559,
    surface1Num: 0x51576d,
    surface2Num: 0x626880,
    overlay0Num: 0x737994,
    overlay1Num: 0x838ba7,
    overlay2Num: 0x949cbb,
    subtext0Num: 0xa5adce,
    subtext1Num: 0xb5bfe2,
    textNum: 0xc6d0f5,
    blueNum: 0x8caaee,
    sapphireNum: 0x85c1dc,
    lavenderNum: 0xbabbf1,
    skyNum: 0x99d1db,
    tealNum: 0x81c8be,
    greenNum: 0xa6d189,
    yellowNum: 0xe5c890,
    peachNum: 0xef9f76,
    maroonNum: 0xea999c,
    redNum: 0xe78284,
    mauveNum: 0xca9ee6,
    pinkNum: 0xf4b8e4,
    flamingoNum: 0xeebebe,
    rosewaterNum: 0xf2d5cf,
  },

  // MediCare+ (Light clinical)
  medicare: {
    isDark: false,
    base: '#fafcff',
    mantle: '#f0f7ff',
    crust: '#ffffff',
    surface0: '#ffffff',
    surface1: '#e2e8f0',
    surface2: '#cbd5e1',
    overlay0: '#94a3b8',
    overlay1: '#475569',
    overlay2: '#64748b',
    subtext0: '#475569',
    subtext1: '#334155',
    text: '#0f172a',
    blue: '#0077b6',
    sapphire: '#0284c7',
    lavender: '#6366f1',
    sky: '#48cae4',
    teal: '#0d9488',
    green: '#059669',
    yellow: '#d97706',
    peach: '#ea580c',
    maroon: '#be123c',
    red: '#dc2626',
    mauve: '#8b5cf6',
    pink: '#db2777',
    flamingo: '#f43f5e',
    rosewater: '#fda4af',

    baseNum: 0xfafcff,
    mantleNum: 0xf0f7ff,
    crustNum: 0xffffff,
    surface0Num: 0xffffff,
    surface1Num: 0xe2e8f0,
    surface2Num: 0xcbd5e1,
    overlay0Num: 0x94a3b8,
    overlay1Num: 0x475569,
    overlay2Num: 0x64748b,
    subtext0Num: 0x475569,
    subtext1Num: 0x334155,
    textNum: 0x0f172a,
    blueNum: 0x0077b6,
    sapphireNum: 0x0284c7,
    lavenderNum: 0x6366f1,
    skyNum: 0x48cae4,
    tealNum: 0x0d9488,
    greenNum: 0x059669,
    yellowNum: 0xd97706,
    peachNum: 0xea580c,
    maroonNum: 0xbe123c,
    redNum: 0xdc2626,
    mauveNum: 0x8b5cf6,
    pinkNum: 0xdb2777,
    flamingoNum: 0xf43f5e,
    rosewaterNum: 0xfda4af,
  },

  // RecipeBook (Warm light)
  recipebook: {
    isDark: false,
    base: '#fffbf5',
    mantle: '#fffbf5',
    crust: '#ffffff',
    surface0: '#ffffff',
    surface1: '#e7e5e4',
    surface2: '#d6d3d1',
    overlay0: '#a8a29e',
    overlay1: '#57534e',
    overlay2: '#78716c',
    subtext0: '#57534e',
    subtext1: '#44403c',
    text: '#1c1917',
    blue: '#2b6cb0',
    sapphire: '#2563eb',
    lavender: '#5a67d8',
    sky: '#4299e1',
    teal: '#0d9488',
    green: '#059669',
    yellow: '#d97706',
    peach: '#ea580c',
    maroon: '#be123c',
    red: '#ef4444',
    mauve: '#805ad5',
    pink: '#db2777',
    flamingo: '#fca5a5',
    rosewater: '#fda4af',

    baseNum: 0xfffbf5,
    mantleNum: 0xfffbf5,
    crustNum: 0xffffff,
    surface0Num: 0xffffff,
    surface1Num: 0xe7e5e4,
    surface2Num: 0xd6d3d1,
    overlay0Num: 0xa8a29e,
    overlay1Num: 0x57534e,
    overlay2Num: 0x78716c,
    subtext0Num: 0x57534e,
    subtext1Num: 0x44403c,
    textNum: 0x1c1917,
    blueNum: 0x2b6cb0,
    sapphireNum: 0x2563eb,
    lavenderNum: 0x5a67d8,
    skyNum: 0x4299e1,
    tealNum: 0x0d9488,
    greenNum: 0x059669,
    yellowNum: 0xd97706,
    peachNum: 0xea580c,
    maroonNum: 0xbe123c,
    redNum: 0xef4444,
    mauveNum: 0x805ad5,
    pinkNum: 0xdb2777,
    flamingoNum: 0xfca5a5,
    rosewaterNum: 0xfda4af,
  },

  // PinkCatBoo (Dark lavender / rose)
  pinkcatboo: {
    isDark: true,
    base: '#202330',
    mantle: '#282a3a',
    crust: '#181a24',
    surface0: '#282a3a',
    surface1: '#3d3752',
    surface2: '#9498a1',
    overlay0: '#565970',
    overlay1: '#707070',
    overlay2: '#9498a1',
    subtext0: '#9498a1',
    subtext1: '#c0c4cf',
    text: '#f8fafc',
    blue: '#7dd3fc',
    sapphire: '#38bdf8',
    lavender: '#d8b4fe',
    sky: '#7dd3fc',
    teal: '#81e6d9',
    green: '#4ade80',
    yellow: '#fde047',
    peach: '#fb923c',
    maroon: '#f87171',
    red: '#ff5370',
    mauve: '#d8b4fe',
    pink: '#ff809f',
    flamingo: '#ffe4e6',
    rosewater: '#fca5a5',

    baseNum: 0x202330,
    mantleNum: 0x282a3a,
    crustNum: 0x181a24,
    surface0Num: 0x282a3a,
    surface1Num: 0x3d3752,
    surface2Num: 0x9498a1,
    overlay0Num: 0x565970,
    overlay1Num: 0x707070,
    overlay2Num: 0x9498a1,
    subtext0Num: 0x9498a1,
    subtext1Num: 0xc0c4cf,
    textNum: 0xf8fafc,
    blueNum: 0x7dd3fc,
    sapphireNum: 0x38bdf8,
    lavenderNum: 0xd8b4fe,
    skyNum: 0x7dd3fc,
    tealNum: 0x81e6d9,
    greenNum: 0x4ade80,
    yellowNum: 0xfde047,
    peachNum: 0xfb923c,
    maroonNum: 0xf87171,
    redNum: 0xff5370,
    mauveNum: 0xd8b4fe,
    pinkNum: 0xff809f,
    flamingoNum: 0xffe4e6,
    rosewaterNum: 0xfca5a5,
  },

  // E-Ink (High-contrast paper)
  eink: {
    isDark: false,
    base: '#f4f0e8',
    mantle: '#ede9df',
    crust: '#ffffff',
    surface0: '#eceade',
    surface1: '#d8d5c8',
    surface2: '#b0ada0',
    overlay0: '#8a8880',
    overlay1: '#5c5a54',
    overlay2: '#4a4a42',
    subtext0: '#3c3a34',
    subtext1: '#2a2820',
    text: '#1a1a18',
    blue: '#1a3a6e',
    sapphire: '#1e4080',
    lavender: '#3a2a6e',
    sky: '#1a4a5e',
    teal: '#1a4a3a',
    green: '#1a5c2a',
    yellow: '#5c3a00',
    peach: '#7a2a00',
    maroon: '#5e1a28',
    red: '#7a1a1a',
    mauve: '#4a1a6e',
    pink: '#6e1a3a',
    flamingo: '#5e2a1a',
    rosewater: '#6e3a2a',

    baseNum: 0xf4f0e8,
    mantleNum: 0xede9df,
    crustNum: 0xffffff,
    surface0Num: 0xeceade,
    surface1Num: 0xd8d5c8,
    surface2Num: 0xb0ada0,
    overlay0Num: 0x8a8880,
    overlay1Num: 0x5c5a54,
    overlay2Num: 0x4a4a42,
    subtext0Num: 0x3c3a34,
    subtext1Num: 0x2a2820,
    textNum: 0x1a1a18,
    blueNum: 0x1a3a6e,
    sapphireNum: 0x1e4080,
    lavenderNum: 0x3a2a6e,
    skyNum: 0x1a4a5e,
    tealNum: 0x1a4a3a,
    greenNum: 0x1a5c2a,
    yellowNum: 0x5c3a00,
    peachNum: 0x7a2a00,
    maroonNum: 0x5e1a28,
    redNum: 0x7a1a1a,
    mauveNum: 0x4a1a6e,
    pinkNum: 0x6e1a3a,
    flamingoNum: 0x5e2a1a,
    rosewaterNum: 0x6e3a2a,
  },
}

export function getGamificationThemePalette(themeId: string = ''): GamificationThemePalette {
  const key = themeId && PALETTES[themeId] ? themeId : 'catppuccin'
  const raw = PALETTES[key] || PALETTES.catppuccin

  const colorMap = {
    capital: {
      fill: raw.blueNum,
      stroke: raw.surface2Num,
      highlight: raw.sapphireNum,
      icon: 'citadel',
      name: 'Capital',
    },
    reading_sanctuary: {
      fill: raw.greenNum,
      stroke: raw.surface2Num,
      highlight: raw.tealNum,
      icon: 'temple',
      name: 'Sanctuary',
    },
    archive_spire: {
      fill: raw.skyNum,
      stroke: raw.surface2Num,
      highlight: raw.sapphireNum,
      icon: 'spire',
      name: 'Archive Spire',
    },
    simulation_nexus: {
      fill: raw.blueNum,
      stroke: raw.surface2Num,
      highlight: raw.lavenderNum,
      icon: 'nexus',
      name: 'Simulation Nexus',
    },
    concept_monolith: {
      fill: raw.lavenderNum,
      stroke: raw.surface2Num,
      highlight: raw.mauveNum,
      icon: 'monolith',
      name: 'Concept Monolith',
    },
    observatory_gallery: {
      fill: raw.rosewaterNum,
      stroke: raw.surface2Num,
      highlight: raw.flamingoNum,
      icon: 'observatory',
      name: 'Observatory Gallery',
    },
    quiz_encounter: {
      fill: raw.redNum,
      stroke: raw.surface2Num,
      highlight: raw.maroonNum,
      icon: 'monster',
      name: 'Monster Encounter',
    },
    reflection_decryption: {
      fill: raw.mauveNum,
      stroke: raw.surface2Num,
      highlight: raw.pinkNum,
      icon: 'cipher',
      name: 'Decryption',
    },
    tradeoff_workshop: {
      fill: raw.yellowNum,
      stroke: raw.surface2Num,
      highlight: raw.peachNum,
      icon: 'forge',
      name: 'Workshop',
    },
    boss_lair: {
      fill: raw.maroonNum,
      stroke: raw.surface2Num,
      highlight: raw.rosewaterNum,
      icon: 'titan',
      name: 'Boss Lair',
    },
    locked: {
      fill: raw.surface0Num,
      stroke: raw.surface1Num,
      highlight: raw.surface2Num,
      icon: 'fog',
      name: 'Locked',
    },
  }

  return {
    ...raw,
    id: themeId,
    colorMap,
  }
}

export function useGamificationTheme(): GamificationThemePalette {
  const { themeId } = useTheme()
  return useMemo(() => getGamificationThemePalette(themeId), [themeId])
}
