# Implementation Log - 024 Add Frame Cube Shape

## Summary

Added a new `frame_cube` / `框架方塊` shape.

## Geometry Notes

- The frame cube occupies one 50mm cell.
- The edge thickness is 5mm.
- Geometry is generated from a 3D grid split into `5mm / 40mm / 5mm` spans on X, Y, and Z.
- Only cells touching at least two outer axes are emitted, which leaves the 12 cube edges and keeps face interiors hollow.
- STL generation emits only exterior faces from the 3D occupancy grid, avoiding overlapping cuboids at corners.
- Renderer preview uses the same occupancy-grid logic.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and the macOS portable zip was rebuilt.
