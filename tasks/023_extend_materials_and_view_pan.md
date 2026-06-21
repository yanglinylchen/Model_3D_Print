# Task 023 - Extend Materials and View Pan

## Goal

Add requested material support for roof corners and chimneys, and make keyboard view panning follow the current screen view direction.

## Requirements

- Allow `roof_corner` to export printable `roof_tile` relief on its sloped faces.
- Allow `chimney` to use the same exterior wall relief materials as cubes: brick, rubble stone, metal plate, and grid tile.
- Keep chimney relief on exterior faces only, not inside the hollow shaft.
- Keep material relief STL output manifold.
- Change `T/F/G/H` camera panning to follow the user's current view direction.
- Keep `Q/E` vertical camera lift behavior unchanged.

## Acceptance Checks

- Roof corner roof tile STL includes printable relief and remains manifold.
- Chimney STL includes printable exterior relief for the four cube wall materials and remains manifold.
- Existing STL regression tests remain green.
- Visual, package, and packaged smoke checks pass.
