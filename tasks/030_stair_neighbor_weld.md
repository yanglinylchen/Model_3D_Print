# Task 030 - Stair Neighbor Weld

## Goal

Reduce slicer transparency / non-manifold-style warnings around stair-step blocks that touch supports or adjacent blocks.

## Requirements

- Keep standalone stair-step STL dimensions unchanged.
- When a stair step has a bottom neighbor, extend the stair bottom slightly into the support.
- When a stair step has side neighbors, extend the relevant side slightly into the neighbor.
- When a stair step has a top neighbor, extend the top slightly into the neighbor.
- Respect stair rotation when checking side neighbors.
- Preserve the L-shaped stair profile.

## Acceptance Checks

- Stair step on top of a cube exports with a small support overlap.
- Adjacent stair steps export with small side overlaps at their shared boundary.
- Existing standalone stair tests continue to pass.
