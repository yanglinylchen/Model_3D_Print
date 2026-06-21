# Implementation Note: Task 004 Refine Material Scope, Seams, And Placement

## Summary

Refined material scope, STL seam behavior, vertical camera movement, and mouse face-based placement.

## Changes

- Reduced built-in materials to `brick` and `plain`.
- Added a plain/no-material preview asset.
- Legacy material ids such as `wood`, `stone_slab`, and `wool` now normalize to `plain`.
- Updated bundled examples to use `plain` instead of removed materials.
- Changed cube STL base geometry back to full 50mm cuboids so neighboring blocks physically touch.
- Kept seam appearance as inset/raised surface relief instead of physical spacing between cubes.
- Added `Q/E` continuous camera vertical pan through `cameraLift`.
- Changed pointer placement over an existing block to use the hit face normal as the next target cell.
- Kept Shift-click as a way to select an existing block when face placement would otherwise place a new one.
- Strengthened visual and packaged smoke tests to click once on the ground and once on the visible block face, expecting two blocks.

## Changed Files

- `src/core/constants.js`
- `src/core/model.js`
- `src/core/stl.js`
- `src/renderer/renderer.js`
- `assets/material_previews/plain.svg`
- `assets/examples/*.m3dp`
- `tests/model.test.js`
- `tests/stl.test.js`
- `scripts/visual_smoke.mjs`
- `scripts/packaged_smoke.mjs`

## Checks Run

- `npm test`
- `npm run build:check`
- Manual adjacent STL boundary check
- `npm run visual:smoke`
- `node --check scripts/visual_smoke.mjs && node --check scripts/packaged_smoke.mjs`
- `npm run package:mac`
- `npm run packaged:smoke`

## Check Results

- Unit tests: pass, 15 tests.
- Build/syntax check: pass.
- Adjacent plain cubes: exported x range 0..100 with shared x=50 boundary.
- Visual smoke: pass, `方塊 2 / 10000`.
- macOS package: pass.
- Packaged smoke: pass, 2 material buttons and `方塊 2 / 10000`.
