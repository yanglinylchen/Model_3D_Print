# Task 018 - Rubble Stone Stair Relief

## Goal

Allow the `亂石` material to appear on stair side faces, matching the existing brick stair-side behavior.

## Requirements

- `樓梯` with `亂石` should export printable side relief.
- Relief should only appear on the L-profile side faces.
- Relief should not appear on tread surfaces or top surfaces.
- The stair's missing quarter profile must remain missing.
- STL export must remain closed and manifold.

## Acceptance Checks

- STL tests verify rubble stone stair relief protrudes from exposed side faces.
- STL tests verify top tread surfaces remain flat.
- STL tests verify rubble stone stair relief does not reuse brick side boxes.
- Existing non-manifold checks continue passing.
