# Implementation Note: Task 006 Fix Plain And Prism Non-Manifold STL

## Summary

Fixed non-manifold STL output for plain blocks and triangular prism roof blocks.

## Changes

- Plain blocks no longer export relief shells.
- Cube STL export now emits only exposed faces when exporting a full project.
- Triangular prism STL export now removes shared bottom/end/east faces where applicable.
- Added edge-incidence manifold checks to STL tests.
- Visual and packaged smoke scripts clear localStorage before running so previous autosave data cannot pollute smoke results.

## Changed Files

- `src/core/stl.js`
- `tests/stl.test.js`
- `scripts/visual_smoke.mjs`
- `scripts/packaged_smoke.mjs`

## Checks Run

- `npm test`
- `npm run build:check`
- Manual prism roof row edge count check
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

## Check Results

- Unit tests: pass, 20 tests.
- Build/syntax check: pass.
- Manual roof row check: 0 non-manifold edges.
- Visual smoke: pass, clean start and `方塊 2 / 10000`.
- macOS package: pass.
- Packaged smoke: pass, clean start, 2 material buttons, and `方塊 2 / 10000`.
