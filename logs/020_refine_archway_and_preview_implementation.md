# Implementation Log - 020 Refine Archway and Preview Geometry

## Summary

Refined the archway and preview geometry after testing showed the first archway shape looked too square in the app.

## Geometry Notes

- Replaced the grid-based archway approximation with an 18-segment polygon arch ring.
- Kept the archway occupying two vertical cells, with a 10mm panel thickness.
- Removed the top faces from the two archway side posts so the arch ring can join them without creating three-face shared edges.
- Added STL coverage checks for the rounded opening: the central opening stays hollow below the arch, while the arch ring remains solid above it.
- Switched preview meshes to double-sided material rendering so roof corner and chimney faces do not visually disappear because of face winding.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
