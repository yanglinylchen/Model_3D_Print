# Implementation Note: Task 002 Interaction And STL Material Bug Fixes

## Summary

Fixed user-reported interaction and STL material issues.

## Fixed Bugs

- `A/D` now rotate camera left/right.
- `W/S` now rotate camera up/down through camera pitch.
- Holding `W/A/S/D` continuously rotates the camera through per-frame key state.
- Mouse clicks and pointer movement now raycast into the 3D viewport.
- Mouse can select existing blocks or place at the projected grid location.
- Viewport blocks now use procedural canvas textures for brick, wood, stone slab, and wool material appearance.
- Default camera distance is closer so one 50mm block is visible inside the 1000mm workspace.
- STL cube output now uses rounded-box geometry for approximate R-corner output.
- STL cube output keeps the full 50mm footprint instead of shrinking blocks and creating full physical gaps.
- STL export includes first-pass material-specific relief boxes on exposed faces.

## Changed Files

- `tasks/002_fix_interaction_and_stl_material_bugs.md`
- `src/renderer/index.html`
- `src/renderer/renderer.js`
- `src/core/stl.js`
- `tests/stl.test.js`
- `scripts/visual_smoke.mjs`
- `reports/visual_smoke.png`

## Checks Run

- `npm test`
- `npm run build:check`
- `npm run visual:smoke`
- `npm run package:mac`

## Check Results

- Unit tests: pass, 11 tests.
- Build/syntax check: pass.
- Visual smoke: pass, including mouse placement block-count assertion.
- macOS package: pass.

## Notes

- Renderer uses an import map so Three example modules can resolve `three` in Electron file mode.
- Viewport material appearance is now visible, but future work can add stronger in-scene relief preview if needed.
- STL rounded edges use rounded-box geometry for cube blocks. Triangular prism rounded-edge refinement remains a future hardening item.

