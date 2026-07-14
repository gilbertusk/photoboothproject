import { useMemo } from 'react'
import { TemplateLayout, TemplateSlot } from '@/types'

interface FramePreviewProps {
  layout: TemplateLayout
  slots: number
  name: string
  previewWidth?: number
  inactive?: boolean
  variant?: 'card' | 'panel'
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL THEMES
// Each template name maps to a distinct visual theme + slot geometry
// ─────────────────────────────────────────────────────────────────────────────
export interface FrameTheme {
  canvasBg: string       // overall canvas/paper background
  canvasBorder: string   // outer paper border
  accentTop: string      // top accent stripe colour (or 'none')
  accentTopH: number     // top stripe height (0 = none)
  slotFill: string       // empty photo slot background
  slotBorder: string     // photo slot border
  slotX: string          // crosshair line colour
  numBadgeBg: string     // slot-number badge background
  numBadgeText: string
  footerBg: string       // footer section background
  footerLine: string     // divider line colour
  brandColor: string     // TOBOOTH text colour
  subColor: string       // subtitle text colour
  cornerDecor: boolean   // draw corner marks like a photo print
  filmHoles: boolean     // draw film-perforation holes on the sides
  roundCorners: number   // rx of the paper rect
  outerDarkBg: string    // outer mat / dark background colour
}

export const THEMES: Record<string, FrameTheme> = {
  // ── Classic white photo strip ─────────────────────────────
  classic: {
    canvasBg:     '#FDFCFA',
    canvasBorder: '#E0D8D0',
    accentTop:    '#FF5638',
    accentTopH:   10,
    slotFill:     '#DEDAD5',
    slotBorder:   '#B8B0A8',
    slotX:        '#B0A8A0',
    numBadgeBg:   '#FF5638',
    numBadgeText: '#ffffff',
    footerBg:     '#FDFCFA',
    footerLine:   '#D0C8C0',
    brandColor:   '#FF5638',
    subColor:     '#9E9089',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 4,
    outerDarkBg:  '#1A0D0B',
  },
  // ── Dark film strip (cinema negative) ────────────────────
  film: {
    canvasBg:     '#111111',
    canvasBorder: '#2A2A2A',
    accentTop:    '#none',
    accentTopH:   0,
    slotFill:     '#2C2C2C',
    slotBorder:   '#3D3D3D',
    slotX:        '#4A4A4A',
    numBadgeBg:   '#FF5638',
    numBadgeText: '#ffffff',
    footerBg:     '#111111',
    footerLine:   '#2A2A2A',
    brandColor:   '#FF5638',
    subColor:     '#555555',
    cornerDecor:  false,
    filmHoles:    true,
    roundCorners: 0,
    outerDarkBg:  '#0A0A0A',
  },
  // ── Vintage sepia / warm print ───────────────────────────
  vintage: {
    canvasBg:     '#F5ECD8',
    canvasBorder: '#C8A97A',
    accentTop:    '#8B6343',
    accentTopH:   8,
    slotFill:     '#DDD0B8',
    slotBorder:   '#B8A080',
    slotX:        '#C0A870',
    numBadgeBg:   '#8B6343',
    numBadgeText: '#F5ECD8',
    footerBg:     '#F5ECD8',
    footerLine:   '#C8A97A',
    brandColor:   '#8B6343',
    subColor:     '#A0835A',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 2,
    outerDarkBg:  '#2A1A0A',
  },
  // ── Modern minimal / clean dark ──────────────────────────
  modern: {
    canvasBg:     '#181818',
    canvasBorder: '#FF5638',
    accentTop:    '#FF5638',
    accentTopH:   5,
    slotFill:     '#242424',
    slotBorder:   '#FF5638',
    slotX:        '#FF563840',
    numBadgeBg:   '#FF5638',
    numBadgeText: '#ffffff',
    footerBg:     '#181818',
    footerLine:   '#FF563850',
    brandColor:   '#FF5638',
    subColor:     '#666666',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 6,
    outerDarkBg:  '#0D0D0D',
  },
  // ── Neon / glow dark ─────────────────────────────────────
  neon: {
    canvasBg:     '#0D0D1A',
    canvasBorder: '#9B59B6',
    accentTop:    '#9B59B6',
    accentTopH:   6,
    slotFill:     '#12122A',
    slotBorder:   '#9B59B6',
    slotX:        '#9B59B650',
    numBadgeBg:   '#9B59B6',
    numBadgeText: '#ffffff',
    footerBg:     '#0D0D1A',
    footerLine:   '#9B59B650',
    brandColor:   '#9B59B6',
    subColor:     '#5555AA',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 8,
    outerDarkBg:  '#07070F',
  },
  // ── Polaroid thick-bottom ────────────────────────────────
  polaroid: {
    canvasBg:     '#FFFEF8',
    canvasBorder: '#E8E4DC',
    accentTop:    'none',
    accentTopH:   0,
    slotFill:     '#E0DCD4',
    slotBorder:   '#C8C4BC',
    slotX:        '#C0BCA8',
    numBadgeBg:   '#333333',
    numBadgeText: '#ffffff',
    footerBg:     '#FFFEF8',
    footerLine:   '#E8E4DC',
    brandColor:   '#333333',
    subColor:     '#888880',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 3,
    outerDarkBg:  '#1A1A18',
  },
  // ── Pastel / soft pink ───────────────────────────────────
  pastel: {
    canvasBg:     '#FFF5F8',
    canvasBorder: '#F4C2D0',
    accentTop:    '#F48FB1',
    accentTopH:   10,
    slotFill:     '#FADADF',
    slotBorder:   '#F4A7B9',
    slotX:        '#F4A7B980',
    numBadgeBg:   '#EC407A',
    numBadgeText: '#ffffff',
    footerBg:     '#FFF5F8',
    footerLine:   '#F4C2D0',
    brandColor:   '#EC407A',
    subColor:     '#CE93A8',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 8,
    outerDarkBg:  '#2A0A14',
  },
  // ── Gold / luxury ────────────────────────────────────────
  gold: {
    canvasBg:     '#0A0800',
    canvasBorder: '#D4AF37',
    accentTop:    '#D4AF37',
    accentTopH:   8,
    slotFill:     '#1A1500',
    slotBorder:   '#D4AF37',
    slotX:        '#D4AF3740',
    numBadgeBg:   '#D4AF37',
    numBadgeText: '#0A0800',
    footerBg:     '#0A0800',
    footerLine:   '#D4AF3760',
    brandColor:   '#D4AF37',
    subColor:     '#9A8020',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 4,
    outerDarkBg:  '#050400',
  },
  // ── Monochrome high contrast ─────────────────────────────
  mono: {
    canvasBg:     '#FFFFFF',
    canvasBorder: '#000000',
    accentTop:    '#000000',
    accentTopH:   12,
    slotFill:     '#E8E8E8',
    slotBorder:   '#333333',
    slotX:        '#33333380',
    numBadgeBg:   '#000000',
    numBadgeText: '#ffffff',
    footerBg:     '#FFFFFF',
    footerLine:   '#000000',
    brandColor:   '#000000',
    subColor:     '#666666',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 0,
    outerDarkBg:  '#111111',
  },
  // ── Cherry / crimson dark ────────────────────────────────
  cherry: {
    canvasBg:     '#1A0205',
    canvasBorder: '#8B0000',
    accentTop:    '#C0392B',
    accentTopH:   8,
    slotFill:     '#2A0508',
    slotBorder:   '#8B0000',
    slotX:        '#C0392B50',
    numBadgeBg:   '#C0392B',
    numBadgeText: '#ffffff',
    footerBg:     '#1A0205',
    footerLine:   '#8B000060',
    brandColor:   '#C0392B',
    subColor:     '#6B2020',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 5,
    outerDarkBg:  '#0D0102',
  },
  // ── Mint / fresh green ───────────────────────────────────
  mint: {
    canvasBg:     '#021A0E',
    canvasBorder: '#27AE60',
    accentTop:    '#2ECC71',
    accentTopH:   7,
    slotFill:     '#041F10',
    slotBorder:   '#27AE60',
    slotX:        '#2ECC7140',
    numBadgeBg:   '#27AE60',
    numBadgeText: '#ffffff',
    footerBg:     '#021A0E',
    footerLine:   '#27AE6050',
    brandColor:   '#2ECC71',
    subColor:     '#1A7040',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 6,
    outerDarkBg:  '#010D07',
  },
  // ── Sunset / warm amber ──────────────────────────────────
  sunset: {
    canvasBg:     '#FFF8F0',
    canvasBorder: '#E8892A',
    accentTop:    '#FF8C42',
    accentTopH:   10,
    slotFill:     '#FFE8CC',
    slotBorder:   '#E8892A',
    slotX:        '#E8892A70',
    numBadgeBg:   '#E8892A',
    numBadgeText: '#ffffff',
    footerBg:     '#FFF8F0',
    footerLine:   '#E8C49A',
    brandColor:   '#E8892A',
    subColor:     '#B86820',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 5,
    outerDarkBg:  '#1A0A00',
  },
  // ── Ocean / deep blue ────────────────────────────────────
  ocean: {
    canvasBg:     '#020D1A',
    canvasBorder: '#1565C0',
    accentTop:    '#1E88E5',
    accentTopH:   7,
    slotFill:     '#041226',
    slotBorder:   '#1565C0',
    slotX:        '#1E88E540',
    numBadgeBg:   '#1565C0',
    numBadgeText: '#ffffff',
    footerBg:     '#020D1A',
    footerLine:   '#1565C050',
    brandColor:   '#1E88E5',
    subColor:     '#0D4880',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 7,
    outerDarkBg:  '#01060D',
  },
  // ── Rose gold ────────────────────────────────────────────
  rose: {
    canvasBg:     '#1A0A0D',
    canvasBorder: '#B76E79',
    accentTop:    '#C9848E',
    accentTopH:   8,
    slotFill:     '#2A1015',
    slotBorder:   '#B76E79',
    slotX:        '#C9848E50',
    numBadgeBg:   '#B76E79',
    numBadgeText: '#ffffff',
    footerBg:     '#1A0A0D',
    footerLine:   '#B76E7960',
    brandColor:   '#C9848E',
    subColor:     '#7A404A',
    cornerDecor:  false,
    filmHoles:    false,
    roundCorners: 8,
    outerDarkBg:  '#0D0508',
  },
  // ── Slate / cool grey ────────────────────────────────────
  slate: {
    canvasBg:     '#F0F4F8',
    canvasBorder: '#607D8B',
    accentTop:    '#546E7A',
    accentTopH:   9,
    slotFill:     '#CFD8DC',
    slotBorder:   '#90A4AE',
    slotX:        '#90A4AE80',
    numBadgeBg:   '#546E7A',
    numBadgeText: '#ffffff',
    footerBg:     '#F0F4F8',
    footerLine:   '#B0BEC5',
    brandColor:   '#546E7A',
    subColor:     '#90A4AE',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 4,
    outerDarkBg:  '#1C2A30',
  },
  // ── Cyberpunk / electric yellow ──────────────────────────
  cyber: {
    canvasBg:     '#0A0A00',
    canvasBorder: '#FFEA00',
    accentTop:    '#FFEA00',
    accentTopH:   6,
    slotFill:     '#141400',
    slotBorder:   '#FFEA00',
    slotX:        '#FFEA0040',
    numBadgeBg:   '#FFEA00',
    numBadgeText: '#0A0A00',
    footerBg:     '#0A0A00',
    footerLine:   '#FFEA0050',
    brandColor:   '#FFEA00',
    subColor:     '#888800',
    cornerDecor:  false,
    filmHoles:    true,
    roundCorners: 0,
    outerDarkBg:  '#050500',
  },
  // ── Lavender / dreamy purple ─────────────────────────────
  lavender: {
    canvasBg:     '#F8F5FF',
    canvasBorder: '#B39DDB',
    accentTop:    '#9C6FD6',
    accentTopH:   9,
    slotFill:     '#EDE7FF',
    slotBorder:   '#B39DDB',
    slotX:        '#9C6FD670',
    numBadgeBg:   '#7B1FA2',
    numBadgeText: '#ffffff',
    footerBg:     '#F8F5FF',
    footerLine:   '#B39DDB',
    brandColor:   '#7B1FA2',
    subColor:     '#9C6FD6',
    cornerDecor:  true,
    filmHoles:    false,
    roundCorners: 10,
    outerDarkBg:  '#1A0A2A',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT GEOMETRY DEFINITIONS  (canvas units)
// ─────────────────────────────────────────────────────────────────────────────
interface GeomLayout {
  cW: number          // canvas width
  cH: number          // canvas height
  slots: TemplateSlot[]
  footerH: number     // footer zone height at bottom
}

// All geometries defined at canonical 400px wide
const GEOMETRIES: Record<string, GeomLayout> = {
  // ── 2 slots ──────────────────────────────────────────────
  duo_portrait: {          // standard 2-slot strip
    cW: 400, cH: 900,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 335, width: 340, height: 255 },
    ],
    footerH: 200,
  },
  duo_portrait_sq: {       // 2 slots, square format
    cW: 400, cH: 980,
    slots: [
      { x: 30, y: 50,  width: 340, height: 340 },
      { x: 30, y: 420, width: 340, height: 340 },
    ],
    footerH: 170,
  },
  duo_portrait_tall: {     // 2 slots, tall/narrow
    cW: 360, cH: 1000,
    slots: [
      { x: 25, y: 50,  width: 310, height: 330 },
      { x: 25, y: 410, width: 310, height: 330 },
    ],
    footerH: 210,
  },
  duo_side: {              // 2 slots side-by-side (landscape)
    cW: 800, cH: 500,
    slots: [
      { x: 20,  y: 40, width: 365, height: 360 },
      { x: 415, y: 40, width: 365, height: 360 },
    ],
    footerH: 80,
  },
  // ── 3 slots ──────────────────────────────────────────────
  strip_3: {               // classic 3-photo strip
    cW: 400, cH: 1200,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 340, width: 340, height: 255 },
      { x: 30, y: 630, width: 340, height: 255 },
    ],
    footerH: 200,
  },
  strip_3_compact: {       // 3 slots, tight spacing
    cW: 400, cH: 1080,
    slots: [
      { x: 20, y: 40,  width: 360, height: 270 },
      { x: 20, y: 325, width: 360, height: 270 },
      { x: 20, y: 610, width: 360, height: 270 },
    ],
    footerH: 160,
  },
  strip_3_loose: {         // 3 slots, airy spacing
    cW: 400, cH: 1350,
    slots: [
      { x: 40, y: 70,  width: 320, height: 250 },
      { x: 40, y: 390, width: 320, height: 250 },
      { x: 40, y: 710, width: 320, height: 250 },
    ],
    footerH: 340,
  },
  strip_3_sq: {            // 3 square slots
    cW: 400, cH: 1400,
    slots: [
      { x: 30, y: 50,  width: 340, height: 340 },
      { x: 30, y: 420, width: 340, height: 340 },
      { x: 30, y: 790, width: 340, height: 340 },
    ],
    footerH: 210,
  },
  strip_3_wide: {          // 3 slots side-by-side (landscape)
    cW: 700, cH: 550,
    slots: [
      { x: 20,  y: 40, width: 215, height: 380 },
      { x: 245, y: 40, width: 215, height: 380 },
      { x: 470, y: 40, width: 215, height: 380 },
    ],
    footerH: 80,
  },
  // ── 4 slots ──────────────────────────────────────────────
  collage_4: {             // classic 4-photo strip
    cW: 400, cH: 1500,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 340, width: 340, height: 255 },
      { x: 30, y: 630, width: 340, height: 255 },
      { x: 30, y: 920, width: 340, height: 255 },
    ],
    footerH: 200,
  },
  strip_4_compact: {       // 4 slots, very tight
    cW: 400, cH: 1320,
    slots: [
      { x: 16, y: 30,  width: 368, height: 270 },
      { x: 16, y: 310, width: 368, height: 270 },
      { x: 16, y: 590, width: 368, height: 270 },
      { x: 16, y: 870, width: 368, height: 270 },
    ],
    footerH: 160,
  },
  strip_4_loose: {         // 4 slots, big margins, large footer
    cW: 400, cH: 1700,
    slots: [
      { x: 45, y: 70,  width: 310, height: 240 },
      { x: 45, y: 370, width: 310, height: 240 },
      { x: 45, y: 670, width: 310, height: 240 },
      { x: 45, y: 970, width: 310, height: 240 },
    ],
    footerH: 460,
  },
  strip_4_sq: {            // 4 square slots
    cW: 400, cH: 1800,
    slots: [
      { x: 30, y: 50,  width: 340, height: 340 },
      { x: 30, y: 430, width: 340, height: 340 },
      { x: 30, y: 810, width: 340, height: 340 },
      { x: 30, y: 1190, width: 340, height: 340 },
    ],
    footerH: 210,
  },
  // ── 6 slots ──────────────────────────────────────────────
  strip_6: {               // classic 6-photo strip
    cW: 400, cH: 1900,
    slots: [
      { x: 30, y: 50,   width: 340, height: 255 },
      { x: 30, y: 340,  width: 340, height: 255 },
      { x: 30, y: 630,  width: 340, height: 255 },
      { x: 30, y: 920,  width: 340, height: 255 },
      { x: 30, y: 1210, width: 340, height: 255 },
      { x: 30, y: 1500, width: 340, height: 255 },
    ],
    footerH: 200,
  },
  strip_6_compact: {       // 6 slots, tight
    cW: 400, cH: 1680,
    slots: [
      { x: 16, y: 30,   width: 368, height: 235 },
      { x: 16, y: 275,  width: 368, height: 235 },
      { x: 16, y: 520,  width: 368, height: 235 },
      { x: 16, y: 765,  width: 368, height: 235 },
      { x: 16, y: 1010, width: 368, height: 235 },
      { x: 16, y: 1255, width: 368, height: 235 },
    ],
    footerH: 190,
  },
  strip_6_loose: {         // 6 slots, airy
    cW: 400, cH: 2100,
    slots: [
      { x: 40, y: 60,   width: 320, height: 240 },
      { x: 40, y: 360,  width: 320, height: 240 },
      { x: 40, y: 660,  width: 320, height: 240 },
      { x: 40, y: 960,  width: 320, height: 240 },
      { x: 40, y: 1260, width: 320, height: 240 },
      { x: 40, y: 1560, width: 320, height: 240 },
    ],
    footerH: 300,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve theme + geometry from template name
// ─────────────────────────────────────────────────────────────────────────────
export function resolveTheme(name: string, slots: number): { theme: FrameTheme; geom: GeomLayout } {
  const nl = name.toLowerCase()

  // ── Pick geometry ──────────────────────────────────────────────────────────
  let geomKey: string
  if (slots <= 2) {
    if (nl.includes('side') || (nl.includes('duo') && nl.includes('wide'))) geomKey = 'duo_side'
    else if (nl.includes('square') || nl.includes('sq'))                    geomKey = 'duo_portrait_sq'
    else if (nl.includes('tall') || nl.includes('narrow'))                  geomKey = 'duo_portrait_tall'
    else                                                                     geomKey = 'duo_portrait'
  } else if (slots === 3) {
    if (nl.includes('wide') || nl.includes('horizontal'))                   geomKey = 'strip_3_wide'
    else if (nl.includes('compact') || nl.includes('tight'))                geomKey = 'strip_3_compact'
    else if (nl.includes('loose') || nl.includes('airy') || nl.includes('spaced')) geomKey = 'strip_3_loose'
    else if (nl.includes('square') || nl.includes('sq'))                    geomKey = 'strip_3_sq'
    else                                                                     geomKey = 'strip_3'
  } else if (slots === 4) {
    if (nl.includes('compact') || nl.includes('tight'))                     geomKey = 'strip_4_compact'
    else if (nl.includes('loose') || nl.includes('airy') || nl.includes('spaced')) geomKey = 'strip_4_loose'
    else if (nl.includes('square') || nl.includes('sq'))                    geomKey = 'strip_4_sq'
    else                                                                     geomKey = 'collage_4'
  } else if (slots === 6) {
    if (nl.includes('compact') || nl.includes('tight'))                     geomKey = 'strip_6_compact'
    else if (nl.includes('loose') || nl.includes('airy') || nl.includes('spaced')) geomKey = 'strip_6_loose'
    else                                                                     geomKey = 'strip_6'
  } else {
    geomKey = 'strip_3'
  }

  // ── Pick theme ─────────────────────────────────────────────────────────────
  let themeKey: string
  if      (nl.includes('film') || nl.includes('noir') || nl.includes('cinema'))        themeKey = 'film'
  else if (nl.includes('cyber') || nl.includes('electric') || nl.includes('yellow'))   themeKey = 'cyber'
  else if (nl.includes('vintage') || nl.includes('retro') || nl.includes('sepia'))     themeKey = 'vintage'
  else if (nl.includes('modern') || nl.includes('minimal'))                            themeKey = 'modern'
  else if (nl.includes('neon') || nl.includes('glow'))                                 themeKey = 'neon'
  else if (nl.includes('lavender') || nl.includes('violet') || nl.includes('dream'))   themeKey = 'lavender'
  else if (nl.includes('purple') || nl.includes('amethyst'))                           themeKey = 'neon'
  else if (nl.includes('pastel') || nl.includes('pink') || nl.includes('soft') || nl.includes('cute') || nl.includes('sweet')) themeKey = 'pastel'
  else if (nl.includes('gold') || nl.includes('luxury') || nl.includes('premium') || nl.includes('royal')) themeKey = 'gold'
  else if (nl.includes('mono') || nl.includes('bw') || nl.includes('black white') || nl.includes('b&w')) themeKey = 'mono'
  else if (nl.includes('cherry') || nl.includes('crimson') || nl.includes('burgundy') || nl.includes('wine')) themeKey = 'cherry'
  else if (nl.includes('mint') || nl.includes('green') || nl.includes('nature') || nl.includes('fresh')) themeKey = 'mint'
  else if (nl.includes('sunset') || nl.includes('amber') || nl.includes('orange') || nl.includes('warm')) themeKey = 'sunset'
  else if (nl.includes('ocean') || nl.includes('blue') || nl.includes('navy') || nl.includes('sea'))     themeKey = 'ocean'
  else if (nl.includes('rose') || nl.includes('blush') || nl.includes('mauve'))        themeKey = 'rose'
  else if (nl.includes('slate') || nl.includes('grey') || nl.includes('gray') || nl.includes('cool'))    themeKey = 'slate'
  else if (nl.includes('polaroid') || nl.includes('memo') || nl.includes('print'))     themeKey = 'polaroid'
  else if (nl.includes('dark') || nl.includes('noir'))                                 themeKey = 'film'
  else                                                                                  themeKey = 'classic'

  return { theme: THEMES[themeKey], geom: GEOMETRIES[geomKey] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Also respect layout data from backend if it has real coordinates
// ─────────────────────────────────────────────────────────────────────────────
function resolveGeomFromLayout(layout: TemplateLayout, slots: number, name: string): GeomLayout {
  if (
    layout?.width > 0 &&
    layout?.height > 0 &&
    Array.isArray(layout.slots) &&
    layout.slots.length > 0
  ) {
    // Use backend layout but wrap it in GeomLayout
    const lastSlot = layout.slots[layout.slots.length - 1]
    const footerStart = lastSlot.y + lastSlot.height
    return {
      cW: layout.width,
      cH: layout.height,
      slots: layout.slots,
      footerH: layout.height - footerStart,
    }
  }
  // Fall back to our rich preset
  const { geom } = resolveTheme(name, slots)
  return geom
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG helpers
// ─────────────────────────────────────────────────────────────────────────────
function CameraIcon({
  cx, cy, size = 36, stroke, opacity = 0.4,
}: { cx: number; cy: number; size?: number; stroke: string; opacity?: number }) {
  const hw = size / 2
  const hh = (size * 0.72) / 2
  return (
    <g opacity={opacity}>
      <rect x={cx - hw} y={cy - hh} width={size} height={size * 0.72} rx={size * 0.11}
            fill="none" stroke={stroke} strokeWidth={size * 0.07} />
      <circle cx={cx} cy={cy} r={size * 0.2}
              fill="none" stroke={stroke} strokeWidth={size * 0.07} />
      <rect x={cx - size * 0.13} y={cy - hh - size * 0.14} width={size * 0.26} height={size * 0.16} rx={size * 0.06}
            fill={stroke} />
    </g>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function FramePreview({
  layout,
  slots,
  name,
  previewWidth = 100,
  inactive = false,
}: FramePreviewProps) {
  const { theme } = useMemo(() => resolveTheme(name, slots), [name, slots])
  const geom = useMemo(() => resolveGeomFromLayout(layout, slots, name), [layout, slots, name])

  const { cW, cH, slots: slotDefs, footerH } = geom
  const scale = previewWidth / cW
  const previewH = Math.round(cH * scale)

  const footerBaseY = cH - footerH
  const outerPad = 6
  const shadowId = `shdw-${name.replace(/\W/g, '')}`

  const isWide = cW > cH  // landscape-ish canvas

  return (
    <svg
      width={previewWidth}
      height={previewH}
      viewBox={`0 0 ${cW} ${cH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        width: previewWidth,
        height: previewH,
        maxWidth: '100%',
        maxHeight: '100%',
        flexShrink: 0,
        opacity: inactive ? 0.45 : 1,
        transition: 'opacity 0.25s ease, filter 0.25s ease',
        filter: inactive ? 'saturate(0.35)' : undefined,
      }}
    >
      <defs>
        <filter id={shadowId} x="-15%" y="-10%" width="130%" height="125%">
          <feDropShadow dx="0" dy="6" stdDeviation="16" floodColor="rgba(0,0,0,0.35)" />
        </filter>
        {/* Film-hole gradient */}
        <radialGradient id={`hole-${shadowId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
      </defs>

      {/* ── Outer dark mat ──────────────────────────────────────────── */}
      <rect x={0} y={0} width={cW} height={cH}
            fill={theme.outerDarkBg} rx={theme.roundCorners + 4} />

      {/* ── Film holes (film theme only) ────────────────────────────── */}
      {theme.filmHoles && !isWide && (
        <>
          {/* Left side holes */}
          {Array.from({ length: Math.ceil(cH / 90) }).map((_, i) => (
            <rect key={`lh${i}`}
              x={4} y={20 + i * 90} width={16} height={24} rx={4}
              fill={`url(#hole-${shadowId})`} stroke="#222" strokeWidth={1} />
          ))}
          {/* Right side holes */}
          {Array.from({ length: Math.ceil(cH / 90) }).map((_, i) => (
            <rect key={`rh${i}`}
              x={cW - 20} y={20 + i * 90} width={16} height={24} rx={4}
              fill={`url(#hole-${shadowId})`} stroke="#222" strokeWidth={1} />
          ))}
        </>
      )}

      {/* ── Paper strip ─────────────────────────────────────────────── */}
      <rect
        x={outerPad} y={outerPad}
        width={cW - outerPad * 2} height={cH - outerPad * 2}
        fill={theme.canvasBg}
        stroke={theme.canvasBorder}
        strokeWidth={2.5}
        rx={theme.roundCorners}
        filter={`url(#${shadowId})`}
      />

      {/* ── Top accent stripe ───────────────────────────────────────── */}
      {theme.accentTopH > 0 && theme.accentTop !== 'none' && (
        <>
          <rect
            x={outerPad} y={outerPad}
            width={cW - outerPad * 2} height={theme.accentTopH + 4}
            fill={theme.accentTop}
            rx={theme.roundCorners}
          />
          <rect
            x={outerPad} y={outerPad + theme.accentTopH / 2}
            width={cW - outerPad * 2} height={theme.accentTopH / 2 + 4}
            fill={theme.accentTop}
          />
        </>
      )}

      {/* ── Corner-crop marks (classic / polaroid) ──────────────────── */}
      {theme.cornerDecor && (
        <>
          {slotDefs.map((slot, i) => {
            const m = 4, len = 14, t = 1.5
            const corners = [
              [slot.x - m,              slot.y - m],
              [slot.x + slot.width + m, slot.y - m],
              [slot.x - m,              slot.y + slot.height + m],
              [slot.x + slot.width + m, slot.y + slot.height + m],
            ]
            return corners.map(([cx, cy], ci) => {
              const dx = ci % 2 === 0 ? 1 : -1
              const dy = ci < 2 ? 1 : -1
              return (
                <g key={`cc-${i}-${ci}`} stroke={theme.slotBorder} strokeWidth={t} strokeLinecap="round">
                  <line x1={cx} y1={cy} x2={cx + dx * len} y2={cy} />
                  <line x1={cx} y1={cy} x2={cx} y2={cy + dy * len} />
                </g>
              )
            })
          })}
        </>
      )}

      {/* ── Photo slots ─────────────────────────────────────────────── */}
      {slotDefs.map((slot, i) => {
        const cx = slot.x + slot.width  / 2
        const cy = slot.y + slot.height / 2
        const iconSize = Math.min(slot.width, slot.height) * 0.22

        return (
          <g key={i}>
            {/* Slot fill */}
            <rect
              x={slot.x} y={slot.y}
              width={slot.width} height={slot.height}
              fill={theme.slotFill}
              stroke={theme.slotBorder}
              strokeWidth={2}
              rx={1}
            />
            {/* X crosshair */}
            <line x1={slot.x + 8} y1={slot.y + 8}
                  x2={slot.x + slot.width - 8} y2={slot.y + slot.height - 8}
                  stroke={theme.slotX} strokeWidth={1.5} />
            <line x1={slot.x + slot.width - 8} y1={slot.y + 8}
                  x2={slot.x + 8}               y2={slot.y + slot.height - 8}
                  stroke={theme.slotX} strokeWidth={1.5} />
            {/* Camera icon */}
            <CameraIcon cx={cx} cy={cy} size={iconSize} stroke={theme.slotBorder} opacity={0.5} />
            {/* Number badge — bottom-right of slot */}
            <circle
              cx={slot.x + slot.width - 14}
              cy={slot.y + slot.height - 14}
              r={13}
              fill={theme.numBadgeBg}
              opacity={0.9}
            />
            <text
              x={slot.x + slot.width - 14}
              y={slot.y + slot.height - 9}
              textAnchor="middle"
              fontSize={13}
              fontFamily="'Space Grotesk', Arial, sans-serif"
              fontWeight="900"
              fill={theme.numBadgeText}
            >
              {i + 1}
            </text>
          </g>
        )
      })}

      {/* ── Footer branding ─────────────────────────────────────────── */}
      {footerH > 50 && (
        <>
          <rect
            x={outerPad} y={footerBaseY}
            width={cW - outerPad * 2} height={footerH - outerPad}
            fill={theme.footerBg}
            rx={0}
          />
          {/* Divider */}
          <rect
            x={outerPad + 24} y={footerBaseY + 12}
            width={cW - (outerPad + 24) * 2} height={1.5}
            fill={theme.footerLine}
          />
          {/* Brand */}
          <text
            x={cW / 2} y={footerBaseY + (footerH > 150 ? 55 : 38)}
            textAnchor="middle"
            fontSize={footerH > 150 ? 18 : 14}
            fontFamily="'Space Grotesk', Arial, sans-serif"
            fontWeight="900"
            fill={theme.brandColor}
            letterSpacing={2.5}
          >
            TOBOOTH
          </text>
          {footerH > 120 && (
            <text
              x={cW / 2} y={footerBaseY + 88}
              textAnchor="middle"
              fontSize={10}
              fontFamily="'Space Grotesk', Arial, sans-serif"
              fontWeight="600"
              fill={theme.subColor}
              letterSpacing={2}
            >
              MEMORIES CAPTURED ✦
            </text>
          )}
          {/* Decorative dots */}
          {footerH > 130 && (
            <>
              <circle cx={cW / 2 - 42} cy={footerBaseY + footerH - 30} r={2.5} fill={theme.footerLine} />
              <circle cx={cW / 2}       cy={footerBaseY + footerH - 30} r={2.5} fill={theme.brandColor} opacity={0.7} />
              <circle cx={cW / 2 + 42} cy={footerBaseY + footerH - 30} r={2.5} fill={theme.footerLine} />
            </>
          )}
        </>
      )}

      {/* ── Film-theme side strips (decorative text) ────────────────── */}
      {theme.filmHoles && (
        <>
          <text
            x={14} y={cH / 2}
            textAnchor="middle"
            fontSize={9}
            fontFamily="monospace"
            fontWeight="700"
            fill="#444"
            letterSpacing={3}
            transform={`rotate(-90, 14, ${cH / 2})`}
          >
            TOBOOTH ▪ PHOTOBOOTH
          </text>
          <text
            x={cW - 14} y={cH / 2}
            textAnchor="middle"
            fontSize={9}
            fontFamily="monospace"
            fontWeight="700"
            fill="#444"
            letterSpacing={3}
            transform={`rotate(90, ${cW - 14}, ${cH / 2})`}
          >
            TOBOOTH ▪ PHOTOBOOTH
          </text>
        </>
      )}
    </svg>
  )
}
