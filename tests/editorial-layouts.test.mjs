import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('kiosk and dashboard support the Peach Editorial theme', () => {
  for (const path of [
    'photobooth-app/src/components/canvas/FramePreview.tsx',
    'dashboard/src/components/canvas/FramePreview.tsx',
  ]) {
    const source = read(path)
    assert.match(source, /editorial\s*:/, path)
    assert.match(source, /themeKey\s*=\s*'editorial'/, path)
  }
})

test('Peach Editorial provides intentional geometries for 3, 4, and 6 photos', () => {
  for (const path of [
    'photobooth-app/src/components/canvas/FramePreview.tsx',
    'dashboard/src/components/canvas/FramePreview.tsx',
  ]) {
    const source = read(path)
    for (const slots of [3, 4, 6]) {
      assert.match(source, new RegExp(`editorial_${slots}\\s*:`), `${path}: ${slots} slots`)
    }
  }
})

test('seed data publishes all Peach Editorial layouts', () => {
  const source = read('backend/src/seed-packages.ts')

  for (const slots of [3, 4, 6]) {
    assert.match(source, new RegExp(`PEACH EDITORIAL ${slots}`))
    assert.match(source, new RegExp(`LAYOUTS\\.editorial_${slots}`))
  }
})

test('printed composition includes editorial artwork, not geometry alone', () => {
  const source = read('photobooth-app/src/components/canvas/StripComposer.tsx')

  assert.match(source, /isEditorial/)
  assert.match(source, /EDITION 01/)
  assert.match(source, /PEACH STORIES/)
})
