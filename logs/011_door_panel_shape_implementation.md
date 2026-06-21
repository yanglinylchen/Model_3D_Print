# Implementation Log - 011 Door Panel Shape

## Summary

Added a `door_panel` shape for a printable two-cell-tall door. The door occupies two vertical grid cells in the project model and exports as a 50mm x 100mm x 10mm printable panel.

## Geometry Notes

- The door uses the same panel thickness as the cross window: 10mm.
- Door surface detail is generated as one continuous recessed front mesh rather than overlapping decorative shells.
- The front surface has raised outer rails, a middle rail, and a small handle area.
- The back, sides, and front use matching subdivisions so STL edges remain manifold.
- Rotation uses the existing Z-rotation flow to choose the side the door panel sits on.

## Model Notes

- Added multi-cell occupancy support through occupied grid cells.
- `getBlock` can resolve blocks from any occupied cell, including the upper half of a door.
- Placement prevents collisions with any occupied cell.
- Workspace resize checks all occupied cells.
- Roof support checks ignore a multi-cell block's own occupied cells so the door does not support itself above restricted prisms.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
