# Task 028 - Window Cross Stair Support Legs

## Goal

Fix slicer transparency / non-manifold-style behavior when a `window_cross` is placed above a stair step.

## Requirements

- Keep app preview unchanged.
- Keep standalone `window_cross` STL unchanged.
- When `window_cross` has a `stair_step` directly below, add printable support legs in STL output.
- Support legs should connect the side posts and center bar down to the lower stair tread.
- Preserve hollow window openings.
- Keep automated STL manifold checks passing.

## Acceptance Checks

- `window_cross` above `stair_step` exports with support legs reaching the lower stair tread.
- Existing `window_cross` standalone and rotated tests continue to pass.
- Existing app smoke and packaged smoke checks continue to pass.
