# Task 029 - Adjacent Window Cross Weld

## Goal

Reduce slicer transparency / non-manifold-style warnings for rows of adjacent `window_cross` blocks.

## Requirements

- Keep standalone `window_cross` geometry unchanged.
- When `window_cross` has a neighbor on its local left or right side, extend the matching side frame by a small hidden overlap.
- Respect block rotation when checking neighbors.
- Preserve hollow window openings.
- Keep stair support legs from the previous fix.

## Acceptance Checks

- Two adjacent `window_cross` blocks export with small overlap around their shared boundary.
- Standalone and rotated window cross tests continue to pass.
- App smoke and packaged smoke continue to pass.
