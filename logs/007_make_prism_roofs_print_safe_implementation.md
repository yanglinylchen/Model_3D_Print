# Implementation Note: Task 007 Make Prism Roofs Print Safe

## Summary

Changed STL export to favor slicer-safe closed shells, especially for triangular prism roof blocks.

## Changes

- STL export no longer writes material relief shells for brick cubes.
- Cube shared-face removal now only happens for cube-to-cube full-face contact.
- Triangular prism blocks export closed shells instead of trying to remove partial contact faces.
- Neighboring triangular prisms receive a small 0.08mm weld overlap in STL export to avoid exact edge-only contact.
- Added tests for brick shell-only output and cube-to-prism side contact.

## Changed Files

- `src/core/stl.js`
- `tests/stl.test.js`

## Checks Run

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

## Check Results

- Unit tests: pass, 21 tests.
- Build/syntax check: pass.
- Whitespace check: pass.
- Visual smoke: pass, `方塊 2 / 10000`.
- macOS package: pass.
- Packaged smoke: pass, 2 material buttons and `方塊 2 / 10000`.
