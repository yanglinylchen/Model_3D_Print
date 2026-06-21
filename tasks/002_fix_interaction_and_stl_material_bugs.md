# Task 002: Fix Interaction And STL Material Bugs

## Objective

Fix user-reported bugs in the initial voxel editor implementation.

## Bugs

1. `W/A/S/D` only rotates left/right. `A/D` should rotate yaw left/right, and `W/S` should rotate pitch up/down.
2. Holding `W/A/S/D` should continuously rotate the camera.
3. Mouse cannot choose placement location; blocks can only be placed at the origin.
4. Viewport blocks do not show material character, and STL output appears as smooth flat cubes without rounded edges. Adjacent blocks currently create full physical gaps rather than visible recessed seams.

## Required Fixes

- Add continuous keyboard camera state for yaw and pitch.
- Add mouse raycast placement and selection in the 3D viewport.
- Add procedural material textures/relief cues in viewport block rendering.
- Remove physical block shrink gaps from STL generation.
- Add rounded/chamfered cube geometry to STL export.
- Preserve visible seam/relief geometry without separating adjacent blocks into full gaps.
- Extend tests to cover mouse-independent model/STL guarantees where possible.

## Required Checks

- `npm test`
- `npm run build:check`
- `npm run visual:smoke`
- `npm run package:mac`

