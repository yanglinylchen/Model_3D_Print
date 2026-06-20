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
- macOS-only first release.
- No-install portable distribution.
- Taiwan Traditional Chinese UI.
- Primary user group: children's education.
- Secondary user group: general 3D-print hobbyists.
- Mouse and keyboard interaction.
- Minecraft-like grid block placement.
- WASD camera rotation, mouse-wheel zoom, mouse right-button orbit, and arrow-key block-position movement are acceptable first-release controls.
- Native project save/open.
- Autosave.
- Undo/redo with 50 steps of edit history.
- Delete/erase mode.
- Select an existing block and change its material.
- Copy/paste support for one block including material and generated texture state.
- STL export as one combined STL file.
- STL export should produce a watertight/manifold closed-volume mesh suitable for slicers.
- STL export represents blocks as closed solid geometry, not hollow open shells. Slicer software controls actual print infill.
- Material blocks: brick, wood, stone slab, wool.
- Block shapes: standard cube plus triangular prism roof blocks with 30-degree and 45-degree variants.
- Triangular prism blocks occupy one normal grid cell and cannot share that cell with another block.
- Directional materials and triangular prism blocks support rotation.
- The app offers an automatic material-orientation alignment option for neighboring blocks with the same material.
- Real geometric texture relief for 3D printing, not only visual texture maps.
- Material relief is generated on exposed faces only.
- Rounded edge radius, seam depth, and relief depth use fixed defaults in the first release.
- Rounded block edges.
- Visible seams/boundaries between adjacent blocks.
- Randomized natural material texture variants per placed block.
- Preview uses material colors/appearance; STL export does not need color.
- Built-in example projects.

## Out of Scope Until Confirmed

- Freeform CAD modeling.
- Non-STL export formats.
- Online/cloud storage.
- Multiplayer or collaboration.
- Printer slicing.
- Windows/Linux packaging.
- Multi-select, fill, and mirror tools.
- User-adjustable rounded-edge radius, seam depth, or material relief depth.
