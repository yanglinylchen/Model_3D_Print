# Task 017 - Fix Materials, Fence Joins, and Controls

## Goal

Fix reported STL issues for rubble stone and adjacent fences, then improve navigation and picker ergonomics as the material and shape lists grow.

## Requirements

- Rubble stone STL should not export as brick-like regular cuboid relief.
- Adjacent fence panels should avoid edge-only contact that slicers may report as non-manifold.
- Undo and redo should have keyboard shortcuts.
- Camera panning should support left, right, forward, backward, up, and down.
- Material and shape controls should become compact dropdowns instead of large left-panel button grids.

## Acceptance Checks

- STL tests verify rubble stone uses different, irregular polygon relief from brick.
- STL tests verify adjacent fence panels export with a tiny weld overlap.
- Build checks pass after UI dropdown conversion.
- Visual smoke confirms material and shape controls still render.
- Packaged smoke confirms the macOS app bundle still runs.
