# Task 005: Fix Triangular Prism STL Export

## User Problem

Triangular prism blocks looked triangular in the app, but exported STL displayed strange square brick relief blocks on the sloped roof and material relief where it should not appear.

## Goals

- Keep triangular prism STL output as clean triangular prism geometry.
- Do not apply cube-style brick relief to triangular prisms.
- Do not increase triangular prism height using material relief depth.
- Make STL output respect triangular prism rotation.

## Acceptance Checks

- Brick 30-degree and 45-degree prisms export 8 triangles each.
- Brick prisms do not include brick relief seam vertices.
- 30-degree prism max height stays 28.87mm.
- 45-degree prism max height stays 50mm.
- Rotated prism STL follows block rotation.
- Visual and packaged smoke tests still pass.
