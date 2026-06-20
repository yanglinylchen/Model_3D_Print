# Specification

Status: draft, awaiting requirements confirmation.

## Product Summary

Model 3D Print is a macOS portable desktop 3D block modeling environment for creating printable voxel-style objects. Users define and resize an X/Y/Z grid workspace, place material blocks, inspect the model from multiple viewpoints, copy/paste blocks, and export one combined STL geometry file for 3D printing.

## Core Requirements

- Customizable 3D workspace dimensions.
- Workspace dimensions are X/Y/Z grid counts.
- Workspace resizing during editing.
- Shrinking a workspace is prevented when existing blocks would exceed the new boundary.
- Modeling units use millimeters.
- Default block size is `50mm x 50mm x 50mm`.
- macOS-only first release.
- No-install portable distribution.
- Taiwan Traditional Chinese UI.
- Primary user group: children's education.
- Secondary user group: general 3D-print hobbyists.
- Mouse and keyboard interaction.
- Minecraft-like grid block placement.
- WASD camera rotation, mouse-wheel zoom, mouse right-button orbit, and arrow-key block-position movement are acceptable first-release controls.
- Copy/paste support.
- STL export as one combined STL file.
- Material blocks: brick, wood, stone slab, wool.
- Real geometric texture relief for 3D printing, not only visual texture maps.
- Rounded block edges.
- Visible seams/boundaries between adjacent blocks.
- Randomized natural material texture variants per placed block.

## Out of Scope Until Confirmed

- Freeform CAD modeling.
- Non-STL export formats.
- Online/cloud storage.
- Multiplayer or collaboration.
- Printer slicing.
- Windows/Linux packaging.
- Multi-select, fill, and mirror tools.
