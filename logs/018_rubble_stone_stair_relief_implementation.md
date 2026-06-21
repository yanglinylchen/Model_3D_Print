# Implementation Log - 018 Rubble Stone Stair Relief

## Summary

Enabled `rubble_stone` relief on `stair_step` side faces. The implementation mirrors the brick stair policy of using only the exposed side faces, but uses irregular polygon stones instead of brick cuboids.

## Geometry Notes

- The stair body remains the existing closed L-profile solid.
- Rubble relief is generated on local south/north side faces only.
- The relief rows respect the stair's missing upper quarter by starting upper rows halfway across the side profile.
- Relief is rotated with the stair after generation.
- Tread and top surfaces remain flat so blocks can still be placed above the stair.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
