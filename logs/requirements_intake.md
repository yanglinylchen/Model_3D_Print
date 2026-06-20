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

No follow-up answers yet.

## Confirmed Requirements

- Create `projects/Model_3D_Print`.
- Follow the ToGo Tech project development flow.
- Start with requirements discussion before implementation.
- Desktop app.
- 3D modeling environment.
- User can define workspace size.
- User can change workspace size during modeling.
- Mouse operation is required.
- Keyboard operation is required.
- Combined mouse and keyboard operation should be supported.
- Camera/view rotation controls should include keyboard and/or on-screen controls.
- Object/block placement should support keyboard and/or mouse spatial selection.
- Visual style and interaction model should be similar to Minecraft block building.
- STL export is required for 3D printing.
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

## Open Questions

- Required OS and packaging format.
- Real-world dimensions and grid/export scale.
- Workspace resize behavior when existing blocks exceed new bounds.
- Scope of editing tools for the first release.
- Exact input control scheme.
- Native project save/open requirements.
- STL export structure for multi-material designs.
- Texture controls and default relief depth.
- Performance/model size target.
- UI language.

## User Confirmation

Not confirmed. The workflow must pause here until the user answers open questions and confirms the summarized requirements.

