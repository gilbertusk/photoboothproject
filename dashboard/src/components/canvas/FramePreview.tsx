import { useMemo } from 'react'

interface FramePreviewProps {
  name: string
  slots: number
  previewWidth?: number
  inactive?: boolean
}

interface FrameTheme {
  canvasBg: string
  canvasBorder: string
  accentTop: string
  accentTopH: number
  slotFill: string
  slotBorder: string
  slotX: string
  numBadgeBg: string
  numBadgeText: string
  footerBg: string
  footerLine: string
  brandColor: string
  subColor: string
  cornerDecor: boolean
  filmHoles: boolean
  roundCorners: number
  outerDarkBg: string
}

interface SlotDef { x: number; y: number; width: number; height: number }
interface GeomLayout { cW: number; cH: number; slots: SlotDef[]; footerH: number }

const THEMES: Record<string, FrameTheme> = {
  classic:  { canvasBg:'#FDFCFA', canvasBorder:'#E0D8D0', accentTop:'#FF6B5A', accentTopH:10, slotFill:'#DEDAD5', slotBorder:'#B8B0A8', slotX:'#B0A8A0', numBadgeBg:'#FF6B5A', numBadgeText:'#fff', footerBg:'#FDFCFA', footerLine:'#D0C8C0', brandColor:'#FF6B5A', subColor:'#9E9089', cornerDecor:true,  filmHoles:false, roundCorners:4,  outerDarkBg:'#1A0D0B' },
  film:     { canvasBg:'#111111', canvasBorder:'#2A2A2A', accentTop:'none',    accentTopH:0,  slotFill:'#2C2C2C', slotBorder:'#3D3D3D', slotX:'#4A4A4A', numBadgeBg:'#FF6B5A', numBadgeText:'#fff', footerBg:'#111111', footerLine:'#2A2A2A', brandColor:'#FF6B5A', subColor:'#555555', cornerDecor:false, filmHoles:true,  roundCorners:0,  outerDarkBg:'#0A0A0A' },
  vintage:  { canvasBg:'#F5ECD8', canvasBorder:'#C8A97A', accentTop:'#8B6343', accentTopH:8,  slotFill:'#DDD0B8', slotBorder:'#B8A080', slotX:'#C0A870', numBadgeBg:'#8B6343', numBadgeText:'#F5ECD8', footerBg:'#F5ECD8', footerLine:'#C8A97A', brandColor:'#8B6343', subColor:'#A0835A', cornerDecor:true,  filmHoles:false, roundCorners:2,  outerDarkBg:'#2A1A0A' },
  modern:   { canvasBg:'#181818', canvasBorder:'#FF6B5A', accentTop:'#FF6B5A', accentTopH:5,  slotFill:'#242424', slotBorder:'#FF6B5A', slotX:'#FF6B5A40', numBadgeBg:'#FF6B5A', numBadgeText:'#fff', footerBg:'#181818', footerLine:'#FF6B5A50', brandColor:'#FF6B5A', subColor:'#666', cornerDecor:false, filmHoles:false, roundCorners:6,  outerDarkBg:'#0D0D0D' },
  neon:     { canvasBg:'#0D0D1A', canvasBorder:'#9B59B6', accentTop:'#9B59B6', accentTopH:6,  slotFill:'#12122A', slotBorder:'#9B59B6', slotX:'#9B59B650', numBadgeBg:'#9B59B6', numBadgeText:'#fff', footerBg:'#0D0D1A', footerLine:'#9B59B650', brandColor:'#9B59B6', subColor:'#5555AA', cornerDecor:false, filmHoles:false, roundCorners:8,  outerDarkBg:'#07070F' },
  polaroid: { canvasBg:'#FFFEF8', canvasBorder:'#E8E4DC', accentTop:'none',    accentTopH:0,  slotFill:'#E0DCD4', slotBorder:'#C8C4BC', slotX:'#C0BCA8', numBadgeBg:'#333',    numBadgeText:'#fff', footerBg:'#FFFEF8', footerLine:'#E8E4DC', brandColor:'#333333', subColor:'#888880', cornerDecor:false, filmHoles:false, roundCorners:3,  outerDarkBg:'#1A1A18' },
  pastel:   { canvasBg:'#FFF5F8', canvasBorder:'#F4C2D0', accentTop:'#F48FB1', accentTopH:10, slotFill:'#FADADF', slotBorder:'#F4A7B9', slotX:'#F4A7B980', numBadgeBg:'#EC407A', numBadgeText:'#fff', footerBg:'#FFF5F8', footerLine:'#F4C2D0', brandColor:'#EC407A', subColor:'#CE93A8', cornerDecor:true,  filmHoles:false, roundCorners:8,  outerDarkBg:'#2A0A14' },
  gold:     { canvasBg:'#0A0800', canvasBorder:'#D4AF37', accentTop:'#D4AF37', accentTopH:8,  slotFill:'#1A1500', slotBorder:'#D4AF37', slotX:'#D4AF3740', numBadgeBg:'#D4AF37', numBadgeText:'#0A0800', footerBg:'#0A0800', footerLine:'#D4AF3760', brandColor:'#D4AF37', subColor:'#9A8020', cornerDecor:false, filmHoles:false, roundCorners:4,  outerDarkBg:'#050400' },
  mono:     { canvasBg:'#FFFFFF', canvasBorder:'#000000', accentTop:'#000000', accentTopH:12, slotFill:'#E8E8E8', slotBorder:'#333333', slotX:'#33333380', numBadgeBg:'#000000', numBadgeText:'#fff', footerBg:'#FFFFFF', footerLine:'#000000', brandColor:'#000000', subColor:'#666666', cornerDecor:true,  filmHoles:false, roundCorners:0,  outerDarkBg:'#111111' },
  cherry:   { canvasBg:'#1A0205', canvasBorder:'#8B0000', accentTop:'#C0392B', accentTopH:8,  slotFill:'#2A0508', slotBorder:'#8B0000', slotX:'#C0392B50', numBadgeBg:'#C0392B', numBadgeText:'#fff', footerBg:'#1A0205', footerLine:'#8B000060', brandColor:'#C0392B', subColor:'#6B2020', cornerDecor:false, filmHoles:false, roundCorners:5,  outerDarkBg:'#0D0102' },
  mint:     { canvasBg:'#021A0E', canvasBorder:'#27AE60', accentTop:'#2ECC71', accentTopH:7,  slotFill:'#041F10', slotBorder:'#27AE60', slotX:'#2ECC7140', numBadgeBg:'#27AE60', numBadgeText:'#fff', footerBg:'#021A0E', footerLine:'#27AE6050', brandColor:'#2ECC71', subColor:'#1A7040', cornerDecor:false, filmHoles:false, roundCorners:6,  outerDarkBg:'#010D07' },
  sunset:   { canvasBg:'#FFF8F0', canvasBorder:'#E8892A', accentTop:'#FF8C42', accentTopH:10, slotFill:'#FFE8CC', slotBorder:'#E8892A', slotX:'#E8892A70', numBadgeBg:'#E8892A', numBadgeText:'#fff', footerBg:'#FFF8F0', footerLine:'#E8C49A', brandColor:'#E8892A', subColor:'#B86820', cornerDecor:true,  filmHoles:false, roundCorners:5,  outerDarkBg:'#1A0A00' },
  ocean:    { canvasBg:'#020D1A', canvasBorder:'#1565C0', accentTop:'#1E88E5', accentTopH:7,  slotFill:'#041226', slotBorder:'#1565C0', slotX:'#1E88E540', numBadgeBg:'#1565C0', numBadgeText:'#fff', footerBg:'#020D1A', footerLine:'#1565C050', brandColor:'#1E88E5', subColor:'#0D4880', cornerDecor:false, filmHoles:false, roundCorners:7,  outerDarkBg:'#01060D' },
  rose:     { canvasBg:'#1A0A0D', canvasBorder:'#B76E79', accentTop:'#C9848E', accentTopH:8,  slotFill:'#2A1015', slotBorder:'#B76E79', slotX:'#C9848E50', numBadgeBg:'#B76E79', numBadgeText:'#fff', footerBg:'#1A0A0D', footerLine:'#B76E7960', brandColor:'#C9848E', subColor:'#7A404A', cornerDecor:false, filmHoles:false, roundCorners:8,  outerDarkBg:'#0D0508' },
  slate:    { canvasBg:'#F0F4F8', canvasBorder:'#607D8B', accentTop:'#546E7A', accentTopH:9,  slotFill:'#CFD8DC', slotBorder:'#90A4AE', slotX:'#90A4AE80', numBadgeBg:'#546E7A', numBadgeText:'#fff', footerBg:'#F0F4F8', footerLine:'#B0BEC5', brandColor:'#546E7A', subColor:'#90A4AE', cornerDecor:true,  filmHoles:false, roundCorners:4,  outerDarkBg:'#1C2A30' },
  cyber:    { canvasBg:'#0A0A00', canvasBorder:'#FFEA00', accentTop:'#FFEA00', accentTopH:6,  slotFill:'#141400', slotBorder:'#FFEA00', slotX:'#FFEA0040', numBadgeBg:'#FFEA00', numBadgeText:'#0A0A00', footerBg:'#0A0A00', footerLine:'#FFEA0050', brandColor:'#FFEA00', subColor:'#888800', cornerDecor:false, filmHoles:true,  roundCorners:0,  outerDarkBg:'#050500' },
  lavender: { canvasBg:'#F8F5FF', canvasBorder:'#B39DDB', accentTop:'#9C6FD6', accentTopH:9,  slotFill:'#EDE7FF', slotBorder:'#B39DDB', slotX:'#9C6FD670', numBadgeBg:'#7B1FA2', numBadgeText:'#fff', footerBg:'#F8F5FF', footerLine:'#B39DDB', brandColor:'#7B1FA2', subColor:'#9C6FD6', cornerDecor:true,  filmHoles:false, roundCorners:10, outerDarkBg:'#1A0A2A' },
  editorial:{ canvasBg:'#FFF8F3', canvasBorder:'#F6D3C3', accentTop:'#FF6B5A', accentTopH:0,  slotFill:'#FFEADF', slotBorder:'#3B1D12', slotX:'#A57C6B80', numBadgeBg:'#FF6B5A', numBadgeText:'#fff', footerBg:'#FFF8F3', footerLine:'#3B1D12', brandColor:'#3B1D12', subColor:'#A57C6B', cornerDecor:false, filmHoles:false, roundCorners:0, outerDarkBg:'#FFE4D6' },
}

const GEOMETRIES: Record<string, GeomLayout> = {
  duo_portrait:     { cW:400, cH:900,  slots:[{x:30,y:50,width:340,height:255},{x:30,y:335,width:340,height:255}], footerH:200 },
  duo_portrait_sq:  { cW:400, cH:980,  slots:[{x:30,y:50,width:340,height:340},{x:30,y:420,width:340,height:340}], footerH:170 },
  duo_portrait_tall:{ cW:360, cH:1000, slots:[{x:25,y:50,width:310,height:330},{x:25,y:410,width:310,height:330}], footerH:210 },
  strip_3:          { cW:400, cH:1200, slots:[{x:30,y:50,width:340,height:255},{x:30,y:340,width:340,height:255},{x:30,y:630,width:340,height:255}], footerH:200 },
  strip_3_compact:  { cW:400, cH:1080, slots:[{x:20,y:40,width:360,height:270},{x:20,y:325,width:360,height:270},{x:20,y:610,width:360,height:270}], footerH:160 },
  strip_3_loose:    { cW:400, cH:1350, slots:[{x:40,y:70,width:320,height:250},{x:40,y:390,width:320,height:250},{x:40,y:710,width:320,height:250}], footerH:340 },
  strip_3_sq:       { cW:400, cH:1400, slots:[{x:30,y:50,width:340,height:340},{x:30,y:420,width:340,height:340},{x:30,y:790,width:340,height:340}], footerH:210 },
  editorial_3:      { cW:500, cH:1200, slots:[{x:36,y:130,width:400,height:250},{x:64,y:420,width:400,height:250},{x:36,y:710,width:400,height:250}], footerH:240 },
  collage_4:        { cW:400, cH:1500, slots:[{x:30,y:50,width:340,height:255},{x:30,y:340,width:340,height:255},{x:30,y:630,width:340,height:255},{x:30,y:920,width:340,height:255}], footerH:200 },
  strip_4_compact:  { cW:400, cH:1320, slots:[{x:16,y:30,width:368,height:270},{x:16,y:310,width:368,height:270},{x:16,y:590,width:368,height:270},{x:16,y:870,width:368,height:270}], footerH:160 },
  strip_4_loose:    { cW:400, cH:1700, slots:[{x:45,y:70,width:310,height:240},{x:45,y:370,width:310,height:240},{x:45,y:670,width:310,height:240},{x:45,y:970,width:310,height:240}], footerH:460 },
  strip_4_sq:       { cW:400, cH:1800, slots:[{x:30,y:50,width:340,height:340},{x:30,y:430,width:340,height:340},{x:30,y:810,width:340,height:340},{x:30,y:1190,width:340,height:340}], footerH:210 },
  editorial_4:      { cW:500, cH:1460, slots:[{x:36,y:130,width:390,height:250},{x:74,y:425,width:390,height:250},{x:36,y:720,width:390,height:250},{x:74,y:1015,width:390,height:250}], footerH:195 },
  strip_6:          { cW:400, cH:1900, slots:[{x:30,y:50,width:340,height:255},{x:30,y:340,width:340,height:255},{x:30,y:630,width:340,height:255},{x:30,y:920,width:340,height:255},{x:30,y:1210,width:340,height:255},{x:30,y:1500,width:340,height:255}], footerH:200 },
  strip_6_compact:  { cW:400, cH:1680, slots:[{x:16,y:30,width:368,height:235},{x:16,y:275,width:368,height:235},{x:16,y:520,width:368,height:235},{x:16,y:765,width:368,height:235},{x:16,y:1010,width:368,height:235},{x:16,y:1255,width:368,height:235}], footerH:190 },
  strip_6_loose:    { cW:400, cH:2100, slots:[{x:40,y:60,width:320,height:240},{x:40,y:360,width:320,height:240},{x:40,y:660,width:320,height:240},{x:40,y:960,width:320,height:240},{x:40,y:1260,width:320,height:240},{x:40,y:1560,width:320,height:240}], footerH:300 },
  editorial_6:      { cW:500, cH:1240, slots:[{x:32,y:130,width:210,height:250},{x:258,y:130,width:210,height:250},{x:52,y:410,width:210,height:250},{x:238,y:410,width:210,height:250},{x:32,y:690,width:210,height:250},{x:258,y:690,width:210,height:250}], footerH:300 },
}

function resolve(name: string, slots: number): { theme: FrameTheme; geom: GeomLayout } {
  const nl = name.toLowerCase()

  let geomKey: string
  if (slots <= 2) {
    if (nl.includes('square') || nl.includes('sq'))                            geomKey = 'duo_portrait_sq'
    else if (nl.includes('tall') || nl.includes('narrow'))                     geomKey = 'duo_portrait_tall'
    else                                                                        geomKey = 'duo_portrait'
  } else if (slots === 3) {
    if (nl.includes('editorial'))                                               geomKey = 'editorial_3'
    else if (nl.includes('compact') || nl.includes('tight'))                   geomKey = 'strip_3_compact'
    else if (nl.includes('loose') || nl.includes('airy'))                      geomKey = 'strip_3_loose'
    else if (nl.includes('square') || nl.includes('sq'))                       geomKey = 'strip_3_sq'
    else                                                                        geomKey = 'strip_3'
  } else if (slots === 4) {
    if (nl.includes('editorial'))                                               geomKey = 'editorial_4'
    else if (nl.includes('compact') || nl.includes('tight'))                   geomKey = 'strip_4_compact'
    else if (nl.includes('loose') || nl.includes('airy'))                      geomKey = 'strip_4_loose'
    else if (nl.includes('square') || nl.includes('sq'))                       geomKey = 'strip_4_sq'
    else                                                                        geomKey = 'collage_4'
  } else if (slots === 6) {
    if (nl.includes('editorial'))                                               geomKey = 'editorial_6'
    else if (nl.includes('compact') || nl.includes('tight'))                   geomKey = 'strip_6_compact'
    else if (nl.includes('loose') || nl.includes('airy'))                      geomKey = 'strip_6_loose'
    else                                                                        geomKey = 'strip_6'
  } else {
    geomKey = 'strip_3'
  }

  let themeKey: string
  if      (nl.includes('editorial') || nl.includes('peach stories'))                   themeKey = 'editorial'
  else if (nl.includes('film') || nl.includes('noir') || nl.includes('cinema'))        themeKey = 'film'
  else if (nl.includes('cyber') || nl.includes('electric'))                            themeKey = 'cyber'
  else if (nl.includes('vintage') || nl.includes('retro') || nl.includes('sepia'))     themeKey = 'vintage'
  else if (nl.includes('modern') || nl.includes('minimal'))                            themeKey = 'modern'
  else if (nl.includes('neon') || nl.includes('glow'))                                 themeKey = 'neon'
  else if (nl.includes('lavender') || nl.includes('violet') || nl.includes('dream'))   themeKey = 'lavender'
  else if (nl.includes('pastel') || nl.includes('pink') || nl.includes('soft') || nl.includes('cute') || nl.includes('sweet')) themeKey = 'pastel'
  else if (nl.includes('gold') || nl.includes('luxury') || nl.includes('premium') || nl.includes('royal')) themeKey = 'gold'
  else if (nl.includes('mono') || nl.includes('bw') || nl.includes('b&w'))             themeKey = 'mono'
  else if (nl.includes('cherry') || nl.includes('crimson') || nl.includes('burgundy')) themeKey = 'cherry'
  else if (nl.includes('mint') || nl.includes('green') || nl.includes('fresh'))        themeKey = 'mint'
  else if (nl.includes('sunset') || nl.includes('amber') || nl.includes('orange') || nl.includes('warm')) themeKey = 'sunset'
  else if (nl.includes('ocean') || nl.includes('blue') || nl.includes('navy'))         themeKey = 'ocean'
  else if (nl.includes('rose') || nl.includes('blush') || nl.includes('mauve'))        themeKey = 'rose'
  else if (nl.includes('slate') || nl.includes('grey') || nl.includes('gray'))         themeKey = 'slate'
  else if (nl.includes('polaroid') || nl.includes('memo') || nl.includes('print'))     themeKey = 'polaroid'
  else if (nl.includes('dark'))                                                         themeKey = 'film'
  else                                                                                  themeKey = 'classic'

  return { theme: THEMES[themeKey], geom: GEOMETRIES[geomKey] }
}

function CameraIcon({ cx, cy, size = 36, stroke, opacity = 0.4 }: { cx:number; cy:number; size?:number; stroke:string; opacity?:number }) {
  const hw = size / 2, hh = (size * 0.72) / 2
  return (
    <g opacity={opacity}>
      <rect x={cx-hw} y={cy-hh} width={size} height={size*0.72} rx={size*0.11} fill="none" stroke={stroke} strokeWidth={size*0.07} />
      <circle cx={cx} cy={cy} r={size*0.2} fill="none" stroke={stroke} strokeWidth={size*0.07} />
      <rect x={cx-size*0.13} y={cy-hh-size*0.14} width={size*0.26} height={size*0.16} rx={size*0.06} fill={stroke} />
    </g>
  )
}

export function FramePreview({ name, slots, previewWidth = 64, inactive = false }: FramePreviewProps) {
  const { theme, geom } = useMemo(() => resolve(name, slots), [name, slots])
  const { cW, cH, slots: slotDefs, footerH } = geom
  const scale = previewWidth / cW
  const previewH = Math.round(cH * scale)
  const footerBaseY = cH - footerH
  const outerPad = 6
  const shadowId = `dash-shdw-${name.replace(/\W/g, '')}`
  const isWide = cW > cH
  const isEditorial = name.toLowerCase().includes('editorial')

  return (
    <svg
      width={previewWidth}
      height={previewH}
      viewBox={`0 0 ${cW} ${cH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', opacity: inactive ? 0.4 : 1 }}
    >
      <defs>
        <filter id={shadowId} x="-15%" y="-10%" width="130%" height="125%">
          <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        <radialGradient id={`hole-${shadowId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
      </defs>

      {/* Outer mat */}
      <rect x={0} y={0} width={cW} height={cH} fill={theme.outerDarkBg} rx={theme.roundCorners + 4} />

      {/* Film holes */}
      {theme.filmHoles && !isWide && (
        <>
          {Array.from({ length: Math.ceil(cH / 90) }).map((_, i) => (
            <rect key={`lh${i}`} x={4} y={20+i*90} width={16} height={24} rx={4} fill={`url(#hole-${shadowId})`} stroke="#222" strokeWidth={1} />
          ))}
          {Array.from({ length: Math.ceil(cH / 90) }).map((_, i) => (
            <rect key={`rh${i}`} x={cW-20} y={20+i*90} width={16} height={24} rx={4} fill={`url(#hole-${shadowId})`} stroke="#222" strokeWidth={1} />
          ))}
        </>
      )}

      {/* Paper strip */}
      <rect x={outerPad} y={outerPad} width={cW-outerPad*2} height={cH-outerPad*2} fill={theme.canvasBg} stroke={theme.canvasBorder} strokeWidth={2.5} rx={theme.roundCorners} filter={`url(#${shadowId})`} />

      {/* Top accent */}
      {theme.accentTopH > 0 && theme.accentTop !== 'none' && (
        <>
          <rect x={outerPad} y={outerPad} width={cW-outerPad*2} height={theme.accentTopH+4} fill={theme.accentTop} rx={theme.roundCorners} />
          <rect x={outerPad} y={outerPad+theme.accentTopH/2} width={cW-outerPad*2} height={theme.accentTopH/2+4} fill={theme.accentTop} />
        </>
      )}

      {isEditorial && (
        <g>
          <rect x={6} y={6} width={278} height={88} fill="#FF6B5A" />
          <text x={28} y={43} fontFamily="Arial, sans-serif" fontSize={18} fontWeight="900" fill="#FFFFFF" letterSpacing={2}>PEACH</text>
          <text x={28} y={72} fontFamily="Arial, sans-serif" fontSize={26} fontWeight="900" fill="#FFFFFF" letterSpacing={1}>STORIES</text>
          <rect x={430} y={26} width={42} height={42} fill="#E8A13A" />
          <text x={408} y={84} textAnchor="end" fontFamily="Arial, sans-serif" fontSize={10} fontWeight="700" fill="#6E4434" letterSpacing={1.5}>EDITION 01</text>
        </g>
      )}

      {/* Corner marks */}
      {theme.cornerDecor && slotDefs.map((slot, i) => {
        const m=4, len=14, t=1.5
        const corners=[[slot.x-m,slot.y-m],[slot.x+slot.width+m,slot.y-m],[slot.x-m,slot.y+slot.height+m],[slot.x+slot.width+m,slot.y+slot.height+m]]
        return corners.map(([cx,cy],ci) => {
          const dx=ci%2===0?1:-1, dy=ci<2?1:-1
          return (
            <g key={`cc-${i}-${ci}`} stroke={theme.slotBorder} strokeWidth={t} strokeLinecap="round">
              <line x1={cx} y1={cy} x2={cx+dx*len} y2={cy} />
              <line x1={cx} y1={cy} x2={cx} y2={cy+dy*len} />
            </g>
          )
        })
      })}

      {/* Photo slots */}
      {slotDefs.map((slot, i) => {
        const cx = slot.x+slot.width/2, cy = slot.y+slot.height/2
        const iconSize = Math.min(slot.width, slot.height)*0.22
        return (
          <g key={i}>
            <rect x={slot.x} y={slot.y} width={slot.width} height={slot.height} fill={theme.slotFill} stroke={theme.slotBorder} strokeWidth={2} rx={1} />
            <line x1={slot.x+8} y1={slot.y+8} x2={slot.x+slot.width-8} y2={slot.y+slot.height-8} stroke={theme.slotX} strokeWidth={1.5} />
            <line x1={slot.x+slot.width-8} y1={slot.y+8} x2={slot.x+8} y2={slot.y+slot.height-8} stroke={theme.slotX} strokeWidth={1.5} />
            <CameraIcon cx={cx} cy={cy} size={iconSize} stroke={theme.slotBorder} opacity={0.5} />
            <circle cx={slot.x+slot.width-14} cy={slot.y+slot.height-14} r={13} fill={theme.numBadgeBg} opacity={0.9} />
            <text x={slot.x+slot.width-14} y={slot.y+slot.height-9} textAnchor="middle" fontSize={13} fontFamily="Arial, sans-serif" fontWeight="900" fill={theme.numBadgeText}>{i+1}</text>
          </g>
        )
      })}

      {/* Footer */}
      {footerH > 50 && (
        <>
          <rect x={outerPad} y={footerBaseY} width={cW-outerPad*2} height={footerH-outerPad} fill={theme.footerBg} />
          <rect x={outerPad+24} y={footerBaseY+12} width={cW-(outerPad+24)*2} height={1.5} fill={theme.footerLine} />
          {isEditorial ? (
            <>
              <text x={30} y={footerBaseY+70} fontSize={28} fontFamily="Arial, sans-serif" fontWeight="900" fill="#3B1D12" letterSpacing={2}>BERTPIXX</text>
              <text x={30} y={footerBaseY+103} fontSize={11} fontFamily="Arial, sans-serif" fontWeight="700" fill="#FF6B5A" letterSpacing={2}>PEACH STORIES</text>
              <text x={470} y={footerBaseY+67} textAnchor="end" fontSize={11} fontFamily="Arial, sans-serif" fontWeight="700" fill="#A57C6B" letterSpacing={1.5}>EDITION 01</text>
              <text x={470} y={footerBaseY+98} textAnchor="end" fontSize={10} fontFamily="Arial, sans-serif" fill="#6E4434">BERTPIXX PHOTOBOOTH</text>
            </>
          ) : (
            <>
              <text x={cW/2} y={footerBaseY+(footerH>150?55:38)} textAnchor="middle" fontSize={footerH>150?18:14} fontFamily="Arial, sans-serif" fontWeight="900" fill={theme.brandColor} letterSpacing={2.5}>BERTPIXX</text>
              {footerH > 120 && <text x={cW/2} y={footerBaseY+88} textAnchor="middle" fontSize={10} fontFamily="Arial, sans-serif" fill={theme.subColor} letterSpacing={2}>MEMORIES CAPTURED</text>}
            </>
          )}
        </>
      )}

      {/* Film side text */}
      {theme.filmHoles && (
        <>
          <text x={14} y={cH/2} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="700" fill="#444" letterSpacing={3} transform={`rotate(-90,14,${cH/2})`}>BERTPIXX ▪ PHOTOBOOTH</text>
          <text x={cW-14} y={cH/2} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="700" fill="#444" letterSpacing={3} transform={`rotate(90,${cW-14},${cH/2})`}>BERTPIXX ▪ PHOTOBOOTH</text>
        </>
      )}
    </svg>
  )
}
