# Contract Check

## Result

Pass. Requirements are confirmed and sufficient to begin UX and visual design.

## Checked Files

- `contract/vision.md`
- `contract/spec.md`
- `contract/acceptance_test.md`
- `contract/ADR.md`
- `logs/requirements_intake.md`

## Production Mode

Production app workflow remains appropriate.

Reasons:

- User-facing macOS desktop app.
- No-install portable packaging requirement.
- Complex 3D viewport, editing, autosave, export, and recovery workflows.
- STL export must produce printable, watertight/manifold geometry with real relief textures.
- UI is intended for children's education and general 3D-print hobbyists, requiring clear interaction design and guardrails.

## User Goals

- Create voxel-style models in a Minecraft-like 3D editor.
- Use 50mm grid cells in a workspace sized by X/Y/Z grid counts.
- Place cube and triangular-prism blocks with printable rounded edges, seams, and material relief.
- Use brick, wood, stone slab, wool, and all materials across cube and triangular-prism shapes.
- Save/reopen `.m3dp` project files and recover autosaved work.
- Export one combined STL that preserves geometry, textures, seams, and solid closed-volume slicer semantics.

## Runtime Target

- macOS first release.
- No-install portable distribution.
- Taiwan Traditional Chinese UI.

## Packaging Target

Portable macOS app bundle or equivalent no-install package. Windows/Linux packaging is out of scope for the first release.

## UI Fidelity Expectations

- Workbench opens directly into the modeling surface.
- No landing page.
- Visual language should be child-friendly but not toy-like: large clear controls, strong affordances, readable Traditional Chinese labels, and safe destructive flows.
- 3D viewport is the primary surface.
- Material previews should show color/appearance even though STL export does not preserve color.
- Export and repair statuses must be understandable to non-CAD users.

## Acceptance Criteria Coverage

Covered:

- Workspace creation, resize limits, and shrink-blocking behavior.
- Project save/open, autosave, and restart recovery prompt.
- Mouse/keyboard controls.
- Undo/redo, erase, material change, copy/paste.
- Cube and triangular-prism block placement.
- Roof support rules.
- Material randomization and manual orientation alignment.
- Printable relief dimensions and STL export requirements.
- Child education guardrails and finished example projects.

## Assumptions

- STL "solid" means watertight/manifold closed-volume mesh interpreted by slicers as printable volume.
- Slicer software controls infill.
- Export repair/optimization must be conservative and may not erase intentional relief, rounded edges, or seams.
- First implementation uses a voxel-grid data model rather than freeform CAD.

## Open Items

None blocking design.

## Gate Decision

Pass. Proceed to UX and visual design artifacts.

