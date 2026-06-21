# Implementation Log - 016 Roof Tile Material

## Summary

Added a `roof_tile` material labeled `瓦片`. It previews as staggered red roof tiles and exports printable relief only on triangular prism roof slopes.

## Geometry Notes

- The base triangular prism remains a closed solid.
- Roof tile relief is generated as a set of closed sloped plates.
- Each plate is embedded slightly into the sloped face and raised outward along the face normal.
- The pattern is deterministic from `textureSeed`, so placed blocks keep their tile layout and copy/paste preserves it.
- Relief is restricted to `prism_30` and `prism_45`; cubes and decorative shapes keep flat geometry when this material is selected.
- The final row reaches the roof ridge so the exported STL visibly protrudes above the original slope.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
