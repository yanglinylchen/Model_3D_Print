# Task 013 - Stair Step Shape

## Goal

Add a stair component that occupies one normal 50mm grid cell but has an L-shaped side profile, like a square with one quarter removed.

## Requirements

- Add a selectable `樓梯` shape.
- The stair occupies one grid cell.
- Side profile is an L shape with a missing upper quarter.
- Rotation should change the stair direction.
- Stair should not restrict direct placement above because it has flat tread surfaces.
- Brick material should create printable relief on the stair's side faces.
- STL export must remain closed and manifold.

## Acceptance Checks

- Model tests allow direct placement above the stair.
- STL tests verify the one-cell bounds and missing upper quarter.
- STL tests verify brick side relief protrudes from stair side faces.
- Existing non-manifold checks continue passing.
