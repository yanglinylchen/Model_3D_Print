# Implementation Note: Task 003 Improve Procedural Material Relief

## Summary

Replaced the first-pass strip relief with denser seed-based procedural STL relief for each material.

## Changes

- Brick now exports raised staggered brick plates with visible mortar valleys.
- Wood now exports segmented grain ridges and knot-like features.
- Stone slab now exports irregular slab islands separated by crack gaps.
- Wool now exports crossing weave ridges and short fiber strokes.
- Relief is generated on all exposed top and side faces instead of only top/east/north.
- Relief uses the block texture seed, face, and rotation so copied blocks retain their pattern.

## Changed Files

- `src/core/stl.js`
- `tests/stl.test.js`

## Checks Run

- `npm test`
- `npm run build:check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`
- Manual STL geometry count check for brick, wood, stone slab, and wool

## Check Results

- Unit tests: pass, 13 tests.
- Build/syntax check: pass.
- Visual smoke: pass, including mouse placement block-count assertion.
- macOS package: pass.
- Packaged smoke: pass, including renderer startup and mouse placement block-count assertion.
- Manual STL geometry counts: brick 900 triangles, wood 2064, stone slab 1260, wool 1860 for one exposed cube.
