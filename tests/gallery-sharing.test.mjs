import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('backend has MediaController with create, get by token, and get session media', () => {
  const source = read('backend/src/controllers/media.controller.ts')

  assert.match(source, /export const createMedia/ )
  assert.match(source, /export const getMediaByToken/ )
  assert.match(source, /export const getSessionMedia/ )
  assert.match(source, /Media\.findOne\(\{ shareToken/ )
  assert.match(source, /Media\.create\(/)
})

test('backend exposes public gallery routes', () => {
  const source = read('backend/src/routes/media.routes.ts')

  assert.match(source, /gallery\/:shareToken/)
  assert.match(source, /sessions\/:sessionId\/media/)
  assert.match(source, /router\.post\(['"]\/['"], createMedia\)/)
})

test('kiosk PreviewScreen creates media records and stores share token', () => {
  const source = read('photobooth-app/src/screens/PreviewScreen.tsx')

  assert.match(source, /\/api\/media/)
  assert.match(source, /setShareToken/)
  assert.match(source, /setGalleryUrl/)
  assert.match(source, /setMediaUrls/)
  assert.match(source, /shareToken/)
  assert.match(source, /galleryUrl/)
})

test('OutputScreen shows social share buttons (WhatsApp, Instagram, copy link)', () => {
  const source = read('photobooth-app/src/screens/OutputScreen.tsx')

  assert.match(source, /galleryUrl/)
  assert.match(source, /shareToken/)
  assert.match(source, /Smartphone/)
  assert.match(source, /Camera/)
  assert.match(source, /wa\.me\//)
  assert.match(source, /instagram\.com\/stories\//)
  assert.match(source, /navigator\.clipboard\.writeText/)
})

test('GalleryScreen displays media, download, and share actions', () => {
  const source = read('photobooth-app/src/screens/GalleryScreen.tsx')

  assert.match(source, /\/api\/public\/gallery\//)
  assert.match(source, /\/api\/public\/sessions\//)
  assert.match(source, /shareToken/)
  assert.match(source, /galleryUrl/)
  assert.match(source, /handleDownload/)
  assert.match(source, /handleShareWhatsApp/)
  assert.match(source, /handleShareInstagram/)
  assert.match(source, /handleCopyLink/)
})

test('sessionStore has gallery/sharing state and actions', () => {
  const source = read('photobooth-app/src/stores/sessionStore.ts')

  assert.match(source, /shareToken: string \| null/)
  assert.match(source, /galleryUrl: string \| null/)
  assert.match(source, /mediaUrls: string\[\]/)
  assert.match(source, /setShareToken/)
  assert.match(source, /setGalleryUrl/)
  assert.match(source, /setMediaUrls/)
})

test('App routes include GalleryScreen', () => {
  const source = read('photobooth-app/src/App.tsx')

  assert.match(source, /GalleryScreen/)
  assert.match(source, /\/gallery\/:shareToken/)
})
