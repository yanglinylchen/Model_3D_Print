# Implementation Log - 032 Avoid Double Stair Weld

## Summary

Avoided double welding at stair-to-upper-block boundaries.

## Diagnosis

The slicer showed a tiny gap-like seam between stairs and upper `window_cross` / `frame_cube` blocks. The STL did not have a real gap: inspection showed vertices at `49.65` and `50.35`, meaning both shapes were overlapping into each other. This double overlap can make slicers draw a seam or boundary line that looks like a small gap.

## Geometry Notes

- If `window_cross` or `frame_cube` sits above a `stair_step`, it no longer extends downward.
- The stair still extends upward by `0.35mm`, so there remains one-sided overlap for slicer safety.
- For stair-to-window and stair-to-frame cases, the boundary now has `z=50` and `z=50.35`, not both `49.65` and `50.35`.
- Adjacent side welds remain unchanged.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`
- Manual STL coordinate probe confirmed `window_cross` and `frame_cube` above stairs now only show `50` and `50.35` near the boundary.

The macOS portable zip was rebuilt and checked.
