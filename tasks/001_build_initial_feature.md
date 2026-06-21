# Task 001: Build Initial Model 3D Print App

## Objective

Implement the first production slice of Model 3D Print as a macOS portable Electron desktop app with a Three.js voxel editor, native `.m3dp` project handling, example loading, block editing, and STL export foundation.

## Inputs

- `contract/vision.md`
- `contract/spec.md`
- `contract/acceptance_test.md`
- `contract/ADR.md`
- `design/design_brief.md`
- `design/visual_direction.md`
- `design/ui_spec.md`
- `design/asset_manifest.md`
- `assets/`

## Allowed Files

- `package.json`
- `package-lock.json`
- `src/`
- `tests/`
- `logs/001_build_initial_feature_implementation.md`
- Supporting project config files required by Electron/Three.js.

## Required Implementation

- Electron desktop app with macOS portable packaging script.
- Three.js 3D viewport with workspace bounds, camera controls, grid, placement cursor, selected-block outline, and visible placed blocks.
- Taiwan Traditional Chinese UI.
- Material swatches and shape selector using approved assets.
- Block model supporting:
  - cube
  - 30-degree triangular prism
  - 45-degree triangular prism
  - brick, wood, stone slab, wool materials
  - rotation
  - fixed per-block texture seed
- Editing support:
  - place/select block
  - erase/delete
  - change selected block material
  - copy/paste one block including texture seed
  - undo/redo 50 steps
  - block count limit 10000
- Workspace support:
  - default `1000mm x 1000mm x 1000mm`
  - maximum `10000mm x 10000mm x 10000mm`
  - 50mm cell size
  - prevent shrinking when blocks would be outside bounds
- Autosave:
  - every 1 minute
  - prompt recovery when autosave is newer than explicit save
- `.m3dp` project save/open.
- Finished example loading from `assets/examples`.
- Placement rule:
  - direct placement above 30-degree or 45-degree prism is blocked unless the upper block has front/back/left/right/top support from another occupied block.
- Material orientation alignment button:
  - user-triggered only
  - warns before changing texture direction/apparent randomness
- STL export foundation:
  - one combined STL
  - closed-volume mesh semantics
  - exposed-face relief concept represented in export path
  - conservative repair/validation scaffold
  - clear blocked/export status

## Required Tests

- Project schema save/open round trip.
- Workspace resize blocking.
- Block count limit.
- 30-degree prism height calculation.
- Roof support placement rule for 30-degree and 45-degree prisms.
- Copy/paste preserves texture seed.
- Undo/redo keeps 50-step history.
- STL export contains ASCII STL and validates non-empty closed-ish triangle output for simple cube.

## Required Checks

- `npm test`
- `npm run build:check`
- If dependencies are installed, run a local app smoke check or renderer syntax check.

## Required Output

- Implementation log at `logs/001_build_initial_feature_implementation.md`.
- Commit with implementation and tests.

