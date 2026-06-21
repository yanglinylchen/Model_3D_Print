# Implementation Log - 012 Door Upper Window

## Summary

Changed the existing `door_panel` shape from a fully solid recessed door into a hybrid door/window object. The lower 50mm remains a solid recessed panel, while the upper 50mm is now a hollow frame with cross bars.

## Geometry Notes

- The door still occupies two vertical grid cells.
- Overall exported bounds remain 50mm x 10mm x 100mm.
- Upper pane openings are omitted from the mesh entirely, so they print as real holes.
- The door is generated from one shared grid of occupied cells, with side walls and depth transitions emitted only where needed.
- The lower half keeps a recessed center and raised rails/handle area.
- The STL tests now sample the upper pane, upper bars, and lower panel to protect the hollow/solid split.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
