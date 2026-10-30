import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('backend has Guestbook controller and route', () => {
  const controller = read('backend/src/controllers/guestbook.controller.ts')
  const route = read('backend/src/routes/guestbook.routes.ts')

  assert.match(controller, /export const getGuestbook/)
  assert.match(route, /router\.get\(['"]\/['"], getGuestbook\)/)
})

test('guestbook route is registered in backend index', () => {
  const source = read('backend/src/index.ts')
  assert.match(source, /app\.use\(['"]\/api\/guestbook['"], guestbookRoutes\)/)
})

test('frontend has GuestBookScreen', () => {
  const source = read('photobooth-app/src/screens/GuestBookScreen.tsx')

  assert.match(source, /\/api\/guestbook/)
  assert.match(source, /export function GuestBookScreen/)
})

test('App routes include guestbook page', () => {
  const source = read('photobooth-app/src/App.tsx')

  assert.match(source, /GuestBookScreen/)
  assert.match(source, /\/guestbook/)
})

test('OutputScreen has reprint button', () => {
  const source = read('photobooth-app/src/screens/OutputScreen.tsx')

  assert.match(source, /CETAK ULANG/)
  assert.match(source, /RefreshCw/)
})

test('PreviewScreen has individual photo replace buttons', () => {
  const source = read('photobooth-app/src/screens/PreviewScreen.tsx')

  assert.match(source, /GANTI FOTO INDIVIDUAL/)
  assert.match(source, /RotateCcw/)
  assert.match(source, /useSessionStore\.setState.*retakeIndex/)
})

test('sessionStore has retakeIndex state and setter', () => {
  const source = read('photobooth-app/src/stores/sessionStore.ts')

  assert.match(source, /retakeIndex: number \| null/)
  assert.match(source, /retakeIndex: null/)
  assert.match(source, /setRetakeIndex:/)
})

test('CameraScreen reads retakeIndex from sessionStore', () => {
  const source = read('photobooth-app/src/screens/CameraScreen.tsx')

  assert.match(source, /retakeIndex: storeRetakeIndex/)
  assert.match(source, /setStoreRetakeIndex/)
  assert.match(source, /replacePhoto\(retakeIndex, photo\)/)
})
