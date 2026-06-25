# Task 027 - Frame Cube Stair Weld

## Goal

Reduce slicer non-manifold warnings when frame cubes are placed on stair steps or directly next to other blocks.

## Requirements

- Treat `框架方塊` as hollow in preview and STL output.
- Keep standalone frame cube dimensions unchanged.
- When a frame cube has a neighboring block on any side, extend the matching frame edge by a small hidden overlap.
- Cover stair support below frame cubes and adjacent frame cube connections.
- Keep automated STL manifold checks passing.

## Acceptance Checks

- A frame cube directly above a stair step exports with a small support overlap.
- Adjacent frame cubes export with small side overlaps at their shared boundary.
- Existing frame cube hollow-center STL test remains unchanged for standalone blocks.
