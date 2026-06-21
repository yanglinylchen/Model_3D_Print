# Task 016 - Roof Tile Material

## Goal

Add a roof tile material that is intended for triangular prism roof pieces and exports printable tile relief on the sloped face.

## Requirements

- Add a selectable `瓦片` material.
- Preview should look like staggered roof tiles.
- STL export should add real relief only to `30° 三角柱` and `45° 三角柱` sloped faces.
- Regular cubes and decorative panel shapes should not receive roof tile relief.
- Tile relief should be generated as closed geometry with a small embed into the sloped face.
- Tile layout should stay fixed after placement and copy/paste because it uses the block texture seed.
- STL export must remain closed and manifold.

## Acceptance Checks

- Material controls include `瓦片`.
- STL tests verify roof tile relief on 30° and 45° prism slopes.
- STL tests verify roof tile material does not add relief to regular cubes.
- Existing non-manifold checks continue passing.
- Visual and packaged smoke checks pass with the new material button.
