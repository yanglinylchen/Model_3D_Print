# Architecture Decision Record

Status: draft, awaiting requirements confirmation.

## ADR-001: Use Production App Workflow

Decision: Use ToGo Tech `production_app_path`.

Reason: The project is a user-facing desktop application with substantial UI, interaction, export, asset/design, testing, and packaging requirements.

## ADR-002: Prefer Voxel-Based Modeling Core

Decision: Treat the first product concept as a voxel-grid editor unless the user asks for freeform CAD.

Reason: The requested Minecraft-like interaction, material blocks, and grid placement naturally fit a voxel data model. STL export can then convert voxel/material data into a printable mesh.

