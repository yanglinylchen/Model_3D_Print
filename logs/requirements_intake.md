# Requirements Intake

## Original User Request

Create a new `projects/Model_3D_Print` project following the ToGo Tech project development flow. First discuss requirements for a desktop app that provides a Minecraft-like 3D block modeling environment. Users can customize the modeling workspace size, resize it during modeling, operate by mouse, keyboard, or combined interactions, place textured rounded-edge material blocks, and export STL files for 3D printing. Required material block types include brick, wood, stone slab, and wool. Textures must be true printable surface geometry/depth, not only visual images. Blocks should have rounded edges so adjacent blocks still show visible seams/boundaries after printing. Natural materials should use randomized texture variation each time a block is created.

## Delivery Mode

Production desktop app project. Requirements intake is in progress before design, architecture, or coding.

## Clarification Questions

- Which operating systems are required for the first release: macOS, Windows, Linux, or all three?
- Should the first app be installable, portable/no-install, or both?
- What is the intended user: hobbyist 3D-print users, kids/education, professional makers, or internal prototyping?
- What physical unit should the modeling grid use: millimeters, centimeters, inches, or unitless voxels with an export scale?
- What should the default block size be in real-world dimensions?
- Should workspace size mean only X/Y/Z grid dimensions, or also physical print bed boundaries and printer presets?
- When resizing the workspace smaller, what should happen to blocks outside the new boundary: prevent resize, crop/delete, or ask each time?
- Should blocks be placed only on an integer voxel grid, or should partial/half blocks, slabs, stairs, rotations, or free placement be supported later?
- Should the first release support removing blocks, undo/redo, copy/paste, multi-select, fill tools, mirror tools, or only single-block placement/removal?
- How should keyboard controls be prioritized: WASD camera rotation, WASD movement/pan, or common 3D editor controls with orbit/pan/zoom?
- Should the app support touchpad gestures or only mouse buttons/wheel plus keyboard?
- Should material randomization be deterministic per file so reopening the same project preserves the exact generated texture?
- Should users be able to edit texture depth/intensity, rounded-edge radius, and seam/gap amount?
- For STL export, should multiple materials export as one combined mesh, separate STL files per material, or both?
- Should the app save and reopen native project files in addition to STL export?
- Are color previews important even though STL itself usually does not preserve material color?
- What performance target matters for the first version: small models, medium tabletop models, or large Minecraft-like builds?
- Should the UI language be Traditional Chinese, English, or bilingual?

## User Answers

- First release target OS: macOS only.
- Distribution format: no-install portable app.
- Intended users: primarily children's education, also usable by general 3D-print hobbyists.
- Modeling unit: millimeters.
- Default block size: `50mm x 50mm x 50mm`.
- Workspace size: X/Y/Z grid counts only. Printer scaling and printer-bed fitting can be handled after STL export.
- Shrinking workspace behavior: if blocks would exceed the new boundary, show a warning and prevent the shrink.
- First-release editing tools: include copy/paste. Multi-select, fill, and mirror are not required.
- Control scheme: WASD camera rotation, mouse wheel zoom, mouse right-button orbit, and arrow keys for cursor/block-position movement are acceptable.
- STL export: export the whole design as one combined STL. All material relief textures must be included as geometry, not exported as flat cubes.
- UI language: Taiwan Traditional Chinese only.
- Native project save/open is required.
- Autosave is required.
- Autosave interval should be 1 minute.
- Native project file extension should be `.m3dp`.
- Undo/redo is required.
- Undo/redo history depth should be 50 steps.
- Delete/erase mode is required.
- User can select an existing block and change its material.
- Copy/paste copies one block, including the material and generated texture state of that block.
- Default workspace size: `1000mm x 1000mm x 1000mm`.
- Maximum first-release workspace size: `10000mm x 10000mm x 10000mm`.
- First-release placed-block count limit should be 10000 blocks.
- Rounded edge radius, seam depth, and material relief depth should use fixed defaults for the first release and do not need user-adjustable controls yet.
- Printable texture feature size should be at least `0.5mm` for clarity and no more than `10mm` for relief size.
- Material relief textures should be generated on exposed faces only.
- Directional materials and blocks should support rotation.
- When neighboring blocks use the same material, the app should offer an option to automatically align material direction/orientation into a visually coherent direction.
- STL export should validate that the mesh is watertight/manifold, automatically repair/optimize when safe, and block export with a clear reason if the mesh remains invalid.
- STL export should automatically run safe repair/optimization before final validation when possible, including welding duplicate vertices, removing degenerate triangles, fixing normals, removing hidden/internal faces, resolving duplicate faces, clamping too-small relief features, and simplifying only where it does not remove required material texture.
- If export repair cannot produce a valid watertight/manifold mesh, STL export should be blocked and the app should show a clear reason.
- Preview should use colors/material appearance, but STL export does not need color.
- Built-in examples are required.
- Add triangular prism block shapes for roof-like sloped surfaces.
- Triangular prism blocks should include 30-degree and 45-degree variants.
- Triangular prism blocks occupy the same grid cell volume as a standard cube block.
- Two triangular prism blocks cannot be stacked in the same grid cell to form a cube.
- Exported STL should represent the model as closed solid volumes, not hollow open shells.
- Child education guardrails should follow recommended defaults: large clear controls, confirmation for destructive actions, delete actions recoverable by undo, and built-in examples/tutorial-oriented entry points.
- 30-degree triangular prism blocks use a `50mm x 50mm x 50mm` cell with a 30-degree sloped face. In local coordinates, the slope rises along one horizontal axis with `z = tan(30°) * x`, so the highest point at `x = 50mm` is about `28.87mm`.
- Because a 30-degree triangular prism does not reach the full `50mm` cell height, placing a block directly above it is prohibited by default and should show a warning. A block A may be placed in that upper cell only when A is connected to another supporting occupied block on A's front, back, left, right, or top side.
- 45-degree triangular prism blocks should use the same direct-above support restriction as 30-degree triangular prism blocks.
- Triangular prism blocks should support all materials.
- Material randomization happens only when a material/block is chosen or created. Once a block is placed, its texture is fixed.
- Copy/paste copies the current block texture exactly, including the generated random texture.
- Automatic material orientation alignment should run only when the user presses an organize/alignment button.
- If automatic material orientation alignment may change apparent texture randomness or texture direction, the app should warn the user before applying it.
- Built-in examples should be finished sample projects only, not guided interactive tutorials.
- On app restart, if an autosave newer than the last explicit save exists, the app should prompt the user to recover the autosaved version.
- Default rounded-edge radius should be `1.5mm`.
- Default seam/gap recessed depth between adjacent blocks should be `1.0mm`.
- Default material relief depths should be twice the initial suggested values: brick `2.4mm`, stone slab `2.4mm`, wood grain `1.6mm`, and wool `1.2mm`.
- Deeper relief can improve visibility but may increase overhang/support issues, create fragile raised details, trap filament or resin in tight grooves, increase STL triangle count, and increase slicer processing time. Export repair must still preserve intentional relief.

## Confirmed Requirements

- Create `projects/Model_3D_Print`.
- Follow the ToGo Tech project development flow.
- Start with requirements discussion before implementation.
- Desktop app.
- First release targets macOS only.
- App should be distributed as a no-install portable build.
- Primary audience is children's education; secondary audience is general 3D-print hobbyists.
- UI language is Taiwan Traditional Chinese.
- 3D modeling environment.
- User can define workspace size.
- User can change workspace size during modeling.
- Workspace dimensions are X/Y/Z grid counts.
- Modeling/export unit is millimeters.
- Default block size is `50mm x 50mm x 50mm`.
- Default workspace size is `1000mm x 1000mm x 1000mm`, equivalent to `20 x 20 x 20` default 50mm cells.
- Maximum first-release workspace size is `10000mm x 10000mm x 10000mm`, equivalent to `200 x 200 x 200` default 50mm cells.
- First-release placed-block count limit is 10000 blocks.
- Printer-bed fit and final print scaling are post-export concerns, not first-release workspace constraints.
- If workspace resizing would place existing blocks outside the new boundary, the app should warn the user and prevent the shrink.
- Native project save/open is required.
- Autosave is required.
- Autosave should run once per minute.
- Native project files should use the `.m3dp` extension.
- Mouse operation is required.
- Keyboard operation is required.
- Combined mouse and keyboard operation should be supported.
- Camera/view controls should support WASD camera rotation, mouse-wheel zoom, mouse right-button orbit, and/or on-screen controls.
- Object/block placement should support mouse placement and keyboard cursor movement with arrow keys.
- Visual style and interaction model should be similar to Minecraft block building.
- Undo/redo is required.
- Undo/redo should retain 50 steps of edit history.
- Delete/erase mode is required.
- Copy/paste is required.
- Copy/paste should copy one block including material and generated texture state.
- Users can select an existing block and change its material.
- Multi-select, fill, and mirror tools are not required for the first release.
- STL export is required for 3D printing.
- STL export should combine the whole design into one STL file.
- STL export must include material relief texture geometry and may not flatten materials into plain cubes.
- STL export should produce a watertight/manifold closed-volume mesh suitable for slicers.
- STL export should represent blocks as solid closed geometry, not hollow open shells; printer infill remains controlled by the slicer.
- STL export should automatically run safe repair/optimization before final validation when possible.
- If automatic repair cannot produce a valid watertight/manifold mesh, export should be blocked with a clear reason.
- At least four material block types: brick, wood, stone slab, wool.
- Add triangular prism block shapes for roof-like slopes, with 30-degree and 45-degree variants.
- Triangular prism blocks occupy one normal grid cell and cannot share a cell with another triangular prism to form a cube.
- 30-degree triangular prism blocks have a 30-degree sloped face and a maximum height of about `28.87mm` within the `50mm` cell.
- The cell directly above a 30-degree triangular prism cannot receive a block unless the upper block has support from an occupied block connected to its front, back, left, right, or top side.
- 45-degree triangular prism blocks use the same direct-above support restriction as 30-degree triangular prism blocks.
- Triangular prism blocks support all materials.
- Material texture must be printable 3D surface detail, not only a rendered image.
- Fixed default values should be used for rounded edge radius, seam depth, and texture relief depth in the first release.
- Default rounded-edge radius is `1.5mm`.
- Default seam/gap recessed depth between adjacent blocks is `1.0mm`.
- Default material relief depths are brick `2.4mm`, stone slab `2.4mm`, wood grain `1.6mm`, and wool `1.2mm`.
- Printable texture feature size should be no smaller than `0.5mm` and no larger than `10mm`.
- Material relief texture should be generated on exposed faces only.
- Block edges need rounded corners/radius.
- Adjacent blocks should preserve visible boundaries/seams after printing.
- Wood, stone slab, wool, and similar natural material blocks should generate randomized texture variation for each placed block.
- Material randomization happens only when a material/block is chosen or created. Placed blocks keep their generated texture fixed.
- Copy/paste preserves the copied block's exact generated texture.
- Directional materials and triangular prism blocks should support rotation.
- When neighboring blocks use the same material, the app should offer automatic material orientation alignment.
- Automatic material orientation alignment should run only from a user-triggered organize/alignment button.
- If material alignment may change texture direction or apparent random texture arrangement, the app should warn the user before applying it.
- Preview should show material color/appearance; STL export does not need color.
- Built-in finished example projects are required.
- Child education guardrails are required: large clear controls, confirmations for destructive actions, undo recovery for deletions, and tutorial/example-oriented entry points.
- On restart, the app should prompt the user to recover autosaved work when an autosave is newer than the last explicit save.

## Assumptions

- The project should use `production_app_path` because it is a polished desktop app with UI, packaging, export, and user-facing workflow requirements.
- The first implementation should prioritize a voxel-grid editor rather than arbitrary CAD solids.
- STL export should generate actual mesh geometry for rounded edges and relief textures.
- The preview can show color/material appearance even if STL export focuses on geometry.
- Randomized textures should be stored with each block so exported and reopened models remain stable.
- macOS portable packaging can be implemented before broader platform packaging.
- STL is a surface mesh format, so "solid" means a closed watertight mesh that slicers interpret as a volume. Actual internal infill percentage is chosen later in slicer software.
- Export validation may fail if generated mesh has holes, non-manifold edges, self-intersections, inverted/ambiguous normals, zero-area/degenerate triangles, overlapping duplicate faces, disconnected accidental fragments, or geometry below the minimum printable texture feature size.
- Automatic export repair/optimization should be conservative: it may improve mesh validity and reduce avoidable artifacts, but it must not erase visible material relief, rounded edges, or intentional seams.
- Deeper relief improves visibility but can increase overhang/support needs, fragile raised features, trapped material in grooves, STL triangle count, and slicer time.

## Open Questions

No open questions remain from requirements intake.

## User Confirmation

Pending final user confirmation. No open requirements-intake questions remain.
