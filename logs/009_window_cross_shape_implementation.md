# Implementation Log - 009 Cross Window Shape

## Summary

Added a `window_cross` shape for a printable hollow window frame. It occupies one normal voxel cell, but its actual geometry is a 10mm thick panel on the selected side of that cell.

## Geometry Notes

- The frame spans the full 50mm x 50mm cell face.
- The panel thickness is 10mm.
- The frame uses 8mm bars around the perimeter and through the center.
- Four window panes are left open.
- Rotation uses the same 90-degree Z rotation flow as prism shapes, so the user can choose which wall side the window sits on.
- STL export generates a connected grid-extruded mesh with internal shared faces removed.

## Files

- Added the shape to core constants.
- Added STL generation for `window_cross`.
- Added renderer preview geometry and a shape icon.
- Added model and STL tests.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
