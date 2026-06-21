# Implementation Log - 017 Fix Materials, Fence Joins, and Controls

## Summary

Fixed rubble stone and adjacent fence STL behavior, then converted the left material and shape controls to dropdowns. Added camera panning shortcuts and made undo/redo shortcuts explicitly prevent default browser behavior.

## Geometry Notes

- Rubble stone now exports irregular polygon plates instead of rectangular brick-like cuboids.
- Rubble stone remains side-only on exposed cube faces.
- Adjacent same-orientation fence panels now overlap by a tiny weld amount along their shared local width edge.
- Fence welds are applied before rotation, so rotated fence panels keep the same strategy.

## Control Notes

- Undo: `Command/Ctrl+Z`.
- Redo: `Command+Shift+Z` or `Ctrl+Y`.
- Rotate view: `W/A/S/D`.
- Pan camera: `T/G` forward/back, `F/H` left/right, `Q/E` down/up.
- Materials and shapes now use compact dropdown selectors.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
