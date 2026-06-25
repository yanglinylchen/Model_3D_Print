# Implementation Log - 027 Frame Cube Stair Weld

## Summary

Updated STL generation for `frame_cube` / `框架方塊` so it welds more reliably to neighboring blocks.

## Geometry Notes

- Standalone frame cubes still export as hollow 12-edge frames from `0..50mm` on each axis.
- Frame cubes now detect neighbors on west, east, south, north, bottom, and top.
- Any side with a neighbor extends by `0.35mm` into that neighbor for STL output.
- This hidden overlap is intended to make edge-only frame connections more slicer-safe, especially:
  - frame cube above stair step
  - adjacent frame cubes
- App preview geometry is unchanged.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

New regression tests cover frame cube support on stair steps and adjacent frame cube welds. The macOS portable zip was rebuilt and checked.
