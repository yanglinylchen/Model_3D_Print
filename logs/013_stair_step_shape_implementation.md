# Implementation Log - 013 Stair Step Shape

## Summary

Added a `stair_step` shape that occupies one standard 50mm cell and exports as an L-profile stair block. The side view is a square with the upper-left quarter removed, giving two flat tread levels.

## Geometry Notes

- The stair is a closed L-profile prism extruded through the full 50mm cell depth.
- Rotation uses the existing Z-rotation flow.
- The stair is not marked as a restricted-top shape, so blocks can be placed directly above it.
- Brick stair blocks emit printable brick relief on the two L-profile side faces.
- Side relief is generated as embedded closed cuboids, matching the print-safe strategy used for brick cube relief.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
