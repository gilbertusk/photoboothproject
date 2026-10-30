# Peach Editorial layout family — TDD evidence

## Scope

Add an editorial-playful photo-strip family for the existing bertpixx packages:

- `PEACH EDITORIAL 3` — REGULAR, 500 × 1200
- `PEACH EDITORIAL 4` — PREMIUM, 500 × 1460
- `PEACH EDITORIAL 6` — ULTIMATE, 500 × 1240

The family uses asymmetric photo placement, a coral `PEACH STORIES` masthead, a gold `EDITION 01` marker, and bertpixx footer artwork. The kiosk preview, dashboard preview, and exported print share the same visual language.

## RED evidence

`node --test tests/editorial-layouts.test.mjs` failed before implementation because neither preview had the editorial theme/geometries, the backend had no matching templates, and `StripComposer` had no editorial artwork.

The failing specification was committed as `0ece6b1` (`test: define Peach Editorial layout family`).

## GREEN guarantees

| Guarantee | Evidence |
|---|---|
| Kiosk and dashboard resolve an `editorial` theme | `tests/editorial-layouts.test.mjs` |
| Dedicated 3-, 4-, and 6-photo geometries exist in both previews | `tests/editorial-layouts.test.mjs` |
| Full seed publishes all three templates | `tests/editorial-layouts.test.mjs` |
| Existing databases can safely upsert them without deleting records | `seed:editorial` regression test |
| Printed output includes the editorial masthead and footer artwork | `StripComposer` regression test |
| Preview masthead/footer copy matches the printed design | preview-copy regression test |

## Geometry review

All slots remain inside their 500 px canvas width. The last photo ends exactly where the footer begins:

- 3-photo: last photo ends at y=960; footer starts at y=960.
- 4-photo: last photo ends at y=1265; footer starts at y=1265.
- 6-photo: last photo ends at y=940; footer starts at y=940.

Masthead content ends before the first photo begins at y=130. Footer artwork stays within the smallest 195 px footer.

## Validation commands

- `node --test tests/*.test.mjs`
- `npm run build` in `backend`
- `npm run build` in `photobooth-app`
- `npm run build` in `dashboard`
- `git diff --check`

## Known lint baseline

The repository builds successfully, but lint is not currently clean. At this checkpoint, kiosk lint reports 21 existing errors and dashboard lint reports 39 errors plus 8 warnings. They are primarily existing `no-explicit-any`, React hook/compiler, and fast-refresh findings and are outside this layout feature's scope.

## Visual-testing limitation

Source geometry and production builds were verified. Full browser screenshot inspection remains unavailable in the built-in browser because the local Vite HTTPS development certificate is self-signed and rejected by that browser environment.
