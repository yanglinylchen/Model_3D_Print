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
- Printer-bed fit and final print scaling are post-export concerns, not first-release workspace constraints.
- If workspace resizing would place existing blocks outside the new boundary, the app should warn the user and prevent the shrink.
- Mouse operation is required.
- Keyboard operation is required.
- Combined mouse and keyboard operation should be supported.
- Camera/view controls should support WASD camera rotation, mouse-wheel zoom, mouse right-button orbit, and/or on-screen controls.
- Object/block placement should support mouse placement and keyboard cursor movement with arrow keys.
- Visual style and interaction model should be similar to Minecraft block building.
- Copy/paste is required.
- Multi-select, fill, and mirror tools are not required for the first release.
- STL export is required for 3D printing.
- STL export should combine the whole design into one STL file.
- STL export must include material relief texture geometry and may not flatten materials into plain cubes.
- At least four material block types: brick, wood, stone slab, wool.
- Material texture must be printable 3D surface detail, not only a rendered image.
- Block edges need rounded corners/radius.
- Adjacent blocks should preserve visible boundaries/seams after printing.
- Wood, stone slab, wool, and similar natural material blocks should generate randomized texture variation for each placed block.

## Assumptions

- The project should use `production_app_path` because it is a polished desktop app with UI, packaging, export, and user-facing workflow requirements.
- The first implementation should prioritize a voxel-grid editor rather than arbitrary CAD solids.
- STL export should generate actual mesh geometry for rounded edges and relief textures.
- The preview can show color/material appearance even if STL export focuses on geometry.
- Randomized textures should be stored with each block so exported and reopened models remain stable.
- macOS portable packaging can be implemented before broader platform packaging.

## Open Questions

- Whether native project save/open is required in the first release.
- Whether autosave is required for classroom use.
- Whether undo/redo is required and how many steps should be retained.
- Whether copy/paste should operate on a single selected block only, or support a copied rectangular selection later.
- Whether the app should include delete/erase mode in the first release.
- Whether block rotation is needed for directional materials such as wood grain or brick courses.
- Default workspace size and maximum supported X/Y/Z grid size.
- Default rounded-edge radius and whether users may edit it.
- Default seam/gap depth between adjacent blocks and whether users may edit it.
- Default relief texture depth per material and whether users may edit texture intensity.
- Whether relief geometry should appear on all block faces or only exposed faces.
- Minimum printable feature size target, such as `0.4mm`, to avoid textures too fine for common printers.
- Whether the app should validate meshes as watertight/manifold before export.
- Whether the preview should show color/material appearance even though STL exports geometry only.
- Whether material randomization should be deterministic per saved project.
- Whether a built-in tutorial or classroom-friendly sample projects are required.
- Whether there should be child-safe guardrails such as simplified mode, large buttons, limited destructive actions, or confirmation prompts.
- Performance target: expected maximum number of blocks in first-release models.

## User Confirmation

Partially confirmed. User answered the first clarification batch, but final confirmation is still pending after follow-up questions are resolved.
