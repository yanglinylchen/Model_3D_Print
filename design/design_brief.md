# Design Brief

Create a Taiwan Traditional Chinese macOS desktop workbench for child-friendly voxel modeling and 3D-print STL export.

The app opens directly into the modeling workspace. The 3D viewport is the primary surface; tool panels support block placement, material selection, workspace settings, autosave recovery, STL export, and mesh repair feedback.

Primary users are children in educational contexts. Secondary users are general 3D-print hobbyists who want an approachable block-based modeling tool.

The interface should feel close to Minecraft-style building while behaving like a reliable 3D-print preparation tool. It should avoid CAD complexity, hidden modes, and destructive surprises.

## Product Promise

Users can build with printable blocks, see material differences while modeling, and export one combined STL with real relief geometry, rounded edges, visible seams, and watertight closed-volume mesh semantics.

## Primary Workflows

- Create or open a `.m3dp` project.
- Recover autosaved work when available.
- Resize the X/Y/Z workspace within limits.
- Select material and shape.
- Place, erase, copy, paste, rotate, and recolor one block at a time.
- Use keyboard and mouse together for camera and placement.
- Use material orientation alignment deliberately through a button.
- Preview and export STL after safe automatic repair/optimization.
- Open finished example projects.

## Design Priorities

- Make the 3D canvas feel central and calm.
- Use large, clear controls for children without making the app feel like a toy.
- Keep destructive actions recoverable and confirmed.
- Explain export repair outcomes in understandable Traditional Chinese.
- Keep material and shape controls highly scannable.
- Preserve a production-tool feel for hobbyists.

## Non-Goals

- No landing page.
- No guided interactive tutorial in the first release.
- No freeform CAD tools.
- No printer slicer controls.
- No multi-select, fill, or mirror tools.

