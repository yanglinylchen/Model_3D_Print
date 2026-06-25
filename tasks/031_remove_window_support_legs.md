# Task 031 - Remove Window Support Legs

## Goal

Remove the STL-only support legs under `window_cross` because slicer output shows they can behave like negative geometry and cut into stair blocks.

## Requirements

- Remove generated support legs below `window_cross`.
- Keep the mild bottom weld for `window_cross` above a support.
- Keep adjacent `window_cross` side welds.
- Keep stair neighbor welds.
- Add a regression check that `window_cross` above `stair_step` does not export geometry below the stair top area.

## Acceptance Checks

- `window_cross` above `stair_step` still exports successfully.
- No `window_cross` support-leg vertices appear below the top of the stair support.
- Existing smoke and packaging checks pass.
