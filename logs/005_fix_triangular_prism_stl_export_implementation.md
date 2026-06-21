# Implementation Note: Task 005 Fix Triangular Prism STL Export

## Summary

Fixed STL export so triangular prism blocks remain clean prism geometry instead of receiving cube-style material relief.

## Changes

- `reliefTrianglesForBlock` now skips non-cube shapes.
- `triangularPrismTriangles` no longer adds material relief depth to prism height.
- Triangular prism STL now applies the block's Z rotation.
- Added tests for clean brick prism STL, exact max heights, missing relief vertices, and rotation.

## Changed Files

- `src/core/stl.js`
- `tests/stl.test.js`

## Checks Run

- `npm test`
- `npm run build:check`
- Manual STL geometry count check for cube, 30-degree prism, and 45-degree prism
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

## Check Results

- Unit tests: pass, 17 tests.
- Build/syntax check: pass.
- Manual STL check: cube 612 triangles with relief; 30-degree prism 8 triangles, maxZ 28.868, no relief seam vertices; 45-degree prism 8 triangles, maxZ 50.000, no relief seam vertices.
- Visual smoke: pass, `方塊 2 / 10000`.
- macOS package: pass.
- Packaged smoke: pass, 2 material buttons and `方塊 2 / 10000`.
