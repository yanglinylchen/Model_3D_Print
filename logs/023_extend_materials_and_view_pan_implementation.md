# Implementation Log - 023 Extend Materials and View Pan

## Summary

Extended material support and adjusted camera panning behavior.

## Material Notes

- `roof_corner` now supports `roof_tile` relief on both sloped faces.
- The roof corner tile relief is clipped inside the triangular slope areas and remains within the one-cell roof corner footprint.
- `chimney` now supports exterior relief for `brick`, `rubble_stone`, `metal_plate`, and `grid_tile`.
- Chimney relief is applied to exposed outer faces only; the hollow interior is left clean.

## Camera Notes

- `F/H` now pan left/right in the current screen view direction.
- `T/G` now pan forward/backward in the current screen view direction.
- `Q/E` continue to move the camera target vertically.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and the macOS portable zip was rebuilt.
