# Implementation Log - 022 Fix Roof Corner Nonmanifold Edges

## Summary

Investigated slicer warnings that appeared after combining roof corners, archways, and regular cubes. The main reproducible issue matching the 4-edge warning was a roof corner placed on top of a cube.

## Findings

- A standalone `roof_corner` exported cleanly.
- A `roof_corner` sitting on a cube produced 4 nonmanifold edges because the cube top and roof corner bottom met as internal support faces.
- A `roof_corner` beside a cube produced exact edge contact. This was less likely to be the screenshot warning but still worth hardening.
- A wall-like archway arrangement can still trigger slicer warnings when a full cube is supported only by edge contact across neighboring wall pieces. That is a structural edge-contact/cantilever case rather than duplicate archway faces.

## Geometry Notes

- Cube top faces are now omitted when a roof corner fully covers them from above.
- Roof corner bottom faces are omitted when there is a block below.
- Roof corners apply a tiny side weld toward same-level neighbors, matching the existing prism weld strategy.
- STL neighbor detection now uses each shape's `heightCells`, so two-cell shapes such as archways are recognized consistently.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and the macOS portable zip was rebuilt.
