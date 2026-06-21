# Task 022 - Fix Roof Corner Nonmanifold Edges

## Goal

Investigate slicer warnings around roof corners and archways, then remove avoidable nonmanifold edges from roof corner STL output.

## Requirements

- Reproduce likely nonmanifold cases with small STL fixtures.
- Fix roof corners placed on top of cubes so internal support faces do not remain.
- Fix roof corners placed beside cubes so exact edge contact does not create slicer warnings.
- Keep standalone roof corners closed and manifold.
- Keep triangular roof prisms and archways from regressing.
- Add regression tests for supported and side-adjacent roof corners.

## Acceptance Checks

- Roof corner on top of a cube exports with zero nonmanifold edges.
- Roof corner beside a cube exports with zero nonmanifold edges.
- Existing prism, archway, and scene object STL tests remain green.
- Build and smoke/package checks pass.
