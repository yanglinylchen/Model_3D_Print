# Specification

Status: draft, awaiting requirements confirmation.

## Product Summary

Model 3D Print is a macOS portable desktop 3D block modeling environment for creating printable voxel-style objects. Users define and resize an X/Y/Z grid workspace, place cube and triangular prism blocks, inspect the model from multiple viewpoints, save/reopen project files, copy/paste blocks, and export one combined STL geometry file for 3D printing.

## Core Requirements

- Customizable 3D workspace dimensions.
- Workspace dimensions are X/Y/Z grid counts.
- Workspace resizing during editing.
- Shrinking a workspace is prevented when existing blocks would exceed the new boundary.
- Modeling units use millimeters.
- Default block size is `50mm x 50mm x 50mm`.
- Default workspace size is `1000mm x 1000mm x 1000mm` (`20 x 20 x 20` default cells).
- Maximum first-release workspace size is `10000mm x 10000mm x 10000mm` (`200 x 200 x 200` default cells).
- First-release placed-block count limit is 10000 blocks.
- macOS-only first release.
- No-install portable distribution.
- Taiwan Traditional Chinese UI.
- Primary user group: children's education.
- Secondary user group: general 3D-print hobbyists.
- Mouse and keyboard interaction.
- Minecraft-like grid block placement.
- WASD camera rotation, mouse-wheel zoom, mouse right-button orbit, and arrow-key block-position movement are acceptable first-release controls.
- Native project save/open.
- Native project files use the `.m3dp` extension.
- Autosave once per minute.
- Undo/redo with 50 steps of edit history.
- Delete/erase mode.
- Select an existing block and change its material.
- Copy/paste support for one block including material and generated texture state.
- STL export as one combined STL file.
- STL export should produce a watertight/manifold closed-volume mesh suitable for slicers.
- STL export represents blocks as closed solid geometry, not hollow open shells. Slicer software controls actual print infill.
- STL export runs safe repair/optimization before final validation where possible, including duplicate vertex welding, degenerate triangle removal, normal correction, hidden/internal face removal, duplicate face resolution, relief feature clamping, and conservative simplification that preserves required texture, rounded edges, and seams.
- If automatic repair cannot produce a valid watertight/manifold mesh, export is blocked with a clear reason.
- Material blocks: brick, wood, stone slab, wool.
- Block shapes: standard cube plus triangular prism roof blocks with 30-degree and 45-degree variants.
- Triangular prism blocks occupy one normal grid cell and cannot share that cell with another block.
- A 30-degree triangular prism has a 30-degree sloped face inside one `50mm x 50mm x 50mm` cell. In local coordinates, the slope rises along one horizontal axis with `z = tan(30°) * x`, making the highest point about `28.87mm` at `x = 50mm`.
- The cell directly above a 30-degree triangular prism is blocked by default. A block may be placed there only if that upper block is connected to another supporting occupied block on its front, back, left, right, or top side.
- 45-degree triangular prism blocks use the same direct-above support restriction as 30-degree triangular prism blocks.
- Triangular prism blocks support all materials.
- Directional materials and triangular prism blocks support rotation.
- The app offers a user-triggered material-orientation alignment button for neighboring blocks with the same material.
- If material orientation alignment may alter texture direction or apparent random texture arrangement, the app warns the user before applying it.
- Real geometric texture relief for 3D printing, not only visual texture maps.
- Material relief is generated on exposed faces only.
- Printable texture feature size is at least `0.5mm` and no more than `10mm`.
- Rounded edge radius, seam depth, and relief depth use fixed defaults in the first release.
- Default rounded-edge radius is `1.5mm`.
- Default seam/gap recessed depth between adjacent blocks is `1.0mm`.
- Default material relief depths are brick `2.4mm`, stone slab `2.4mm`, wood grain `1.6mm`, and wool `1.2mm`.
- Rounded block edges.
- Visible seams/boundaries between adjacent blocks.
- Randomized natural material texture variants are generated when a material/block is chosen or created, then fixed on the placed block.
- Copy/paste preserves the copied block's exact generated texture.
- Preview uses material colors/appearance; STL export does not need color.
- Built-in finished example projects.
- Child education guardrails: large clear controls, confirmations for destructive actions, undo recovery for deletions, and tutorial/example-oriented entry points.
- On restart, if autosave is newer than the last explicit save, the app prompts the user to recover the autosaved version.

## Out of Scope Until Confirmed

- Freeform CAD modeling.
- Non-STL export formats.
- Online/cloud storage.
- Multiplayer or collaboration.
- Printer slicing.
- Windows/Linux packaging.
- Multi-select, fill, and mirror tools.
- User-adjustable rounded-edge radius, seam depth, or material relief depth.
