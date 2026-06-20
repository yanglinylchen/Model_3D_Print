# Architecture Decision Record

Status: draft, awaiting requirements confirmation.

## ADR-001: Use Production App Workflow

Decision: Use ToGo Tech `production_app_path`.

Reason: The project is a user-facing desktop application with substantial UI, interaction, export, asset/design, testing, and packaging requirements.

## ADR-002: Prefer Voxel-Based Modeling Core

Decision: Treat the first product concept as a voxel-grid editor unless the user asks for freeform CAD.

Reason: The requested Minecraft-like interaction, material blocks, and grid placement naturally fit a voxel data model. STL export can then convert voxel/material data into a printable mesh.

## ADR-003: macOS Portable First Release

Decision: Target macOS only for the first release and package as a no-install portable app.

Reason: The user explicitly chose macOS and portable distribution. This narrows packaging risk while preserving the production-app workflow.

## ADR-004: Geometry-First STL Export

Decision: STL export must produce one combined mesh containing rounded edges, visible seams, and material relief as actual geometry.

Reason: STL files do not reliably carry visual texture/material data. The printable result depends on geometry, so textures cannot be only image maps or preview shaders.

## ADR-005: Closed-Volume Mesh Semantics

Decision: Treat exported blocks as closed watertight volumes rather than hollow open shells.

Reason: STL represents surfaces, but slicers infer printable volume from a closed manifold shell. The app should export closed geometry; slicer settings remain responsible for physical infill percentage.

## ADR-006: Cell Occupancy Remains One Block Per Cell

Decision: Every cube or triangular prism occupies one full grid cell for editing and collision purposes.

Reason: The user explicitly does not want two triangular prism blocks to stack inside one cube cell. Keeping one block per cell preserves Minecraft-like simplicity for education users.

## ADR-007: Repair Before Blocking STL Export

Decision: STL export should run conservative automatic repair/optimization before final validation, then block export with a clear reason if the mesh remains invalid.

Reason: Users should not have to understand mesh topology to get printable output, but automated repair must preserve intentional material relief, rounded edges, and seams.

## ADR-008: 30-Degree Roof Support Rule

Decision: A 30-degree triangular prism rises only to about `28.87mm` inside a `50mm` cell. The cell directly above it is blocked unless the upper block is connected to another supporting occupied block on its front, back, left, right, or top side.

Reason: The 30-degree prism does not provide a full-height flat support surface. The placement rule keeps the editor simple while preventing visually unsupported floating blocks.
