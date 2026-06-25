# Task 032 - Avoid Double Stair Weld

## Goal

Reduce slicer seam artifacts that look like tiny gaps between stair steps and upper frame/window blocks.

## Requirements

- Keep stair-to-upper-block overlap for slicer safety.
- Avoid double overlap where the stair extends upward and the upper block also extends downward.
- Apply to `window_cross` and `frame_cube` above `stair_step`.
- Preserve existing side welds for adjacent window/frame blocks.
- Keep automated STL checks passing.

## Acceptance Checks

- `window_cross` above `stair_step` has only stair-side upward overlap around `z=50`.
- `frame_cube` above `stair_step` has only stair-side upward overlap around `z=50`.
- Existing smoke and packaged checks pass.
