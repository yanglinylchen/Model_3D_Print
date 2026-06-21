# Implementation Log - 008 Side-only Brick Relief STL

## Summary

Implemented print-focused side-only brick relief for cube STL export. The relief is generated only for brick cube blocks and only on exposed vertical side faces. Top and bottom faces remain clean so triangular prism roofs do not collide with top-surface brick detail.

## Geometry Notes

- Brick relief uses closed cuboid shells that overlap into the cube wall by 0.08mm.
- Relief rises 1mm from the base side wall, making the mortar gap visually recessed for printing.
- Relief rows are staggered with a deterministic phase based on the block texture seed and face.
- Neighboring side cells suppress relief for that side to avoid decoration inside block-to-block contact.
- Triangular prisms continue to export as simple closed prism shells without material relief.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
