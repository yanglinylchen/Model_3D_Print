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
