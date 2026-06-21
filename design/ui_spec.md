# UI Spec

## Main Window

- Top toolbar:
  - New/Open/Save.
  - Undo/Redo.
  - Copy/Paste.
  - Erase.
  - Rotate block.
  - Align material direction.
  - Export STL.
- Left panel:
  - Material swatches: brick, wood, stone slab, wool.
  - Shape selector: cube, 30-degree prism, 45-degree prism.
  - Finished examples launcher.
- Center:
  - 3D viewport.
  - Workspace grid bounds.
  - Placement cursor.
  - Selected block outline.
  - Semi-transparent camera control buttons.
- Right panel:
  - Selected block material and shape.
  - Rotation/orientation controls.
  - Workspace X/Y/Z inputs.
  - Block count and limit.
  - Autosave state.
  - STL validation/repair state.
- Bottom status bar:
  - Current grid coordinate.
  - Current mode.
  - Latest autosave time.
  - Export warnings.

## Controls

- Workspace size steppers for X/Y/Z cell counts.
- Material swatches with procedural preview thumbnails.
- Shape segmented control.
- Place mode.
- Erase mode.
- Copy block.
- Paste block.
- Change material for selected block.
- Rotate selected block or pending block.
- Align material direction button.
- Export STL button.
- Recover autosave prompt on launch when needed.

## Keyboard And Mouse

- WASD: rotate camera.
- Mouse wheel: zoom.
- Right mouse drag: orbit.
- Arrow keys: move placement cursor.
- Mouse click: place/select block.
- Delete/backspace: erase selected block after guardrail behavior.
- Standard shortcut support for undo/redo, copy, paste, save, and open.

## States

- Empty workspace: show grid, placement cursor, and a gentle prompt in the status area.
- Editing: current material/shape is visible and selected.
- Selected block: outline block and show material/shape in inspector.
- Invalid placement: show warning and prevent placement.
- Directly above 30-degree or 45-degree prism without support: show warning and prevent placement.
- Workspace shrink blocked: show warning and keep previous size.
- Autosave available on restart: show recovery prompt.
- Export preparing: show mesh generation progress.
- Export repairing: show conservative repair/optimization status.
- Export success: show path and slicer-ready note.
- Export blocked: show clear reason and suggested next action.

## Child Guardrails

- Confirm workspace shrink when valid but potentially disruptive.
- Block workspace shrink when existing blocks would be outside the new bounds.
- Confirm destructive erase operations unless undo makes the action immediately recoverable.
- Warn before material orientation alignment if it can alter texture direction or random-looking arrangement.
- Keep warnings short and action-oriented.

## STL Export UX

The export panel reports:

- Block count.
- Exposed-face texture generation.
- Hidden/internal face removal.
- Mesh repair/optimization.
- Watertight/manifold validation.
- Final STL status.

Export is blocked if repair cannot produce a valid watertight/manifold mesh.

