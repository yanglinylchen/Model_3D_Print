# Implementation Log - 029 Adjacent Window Cross Weld

## Summary

Added side weld overlap for adjacent `window_cross` / `十字方框` blocks.

## Diagnosis

The slicer screenshot shows the transparent area across a horizontal row of window crosses. The likely cause is not just stair support: neighboring window crosses were exporting with exact face-to-face contact at the shared grid boundary. That can make slicers treat the row as multiple touching shells rather than a single fused wall.

## Geometry Notes

- Standalone window crosses keep their original `0..50mm` X bounds.
- If a window cross has a left or right neighbor, its matching side frame extends by `0.35mm`.
- Neighbor detection uses the block rotation, so rotated window rows weld in the correct world direction.
- Hollow window openings remain unchanged.
- The stair support legs from the prior fix remain in place.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The new regression test covers two adjacent window crosses and checks for tiny overlap on both sides of the shared boundary. The macOS portable zip was rebuilt and checked.
