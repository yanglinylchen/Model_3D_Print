# Task 020 - Refine Archway and Preview Geometry

## Goal

Refine the archway object so it looks like a rounded arch instead of a stepped block arch, and stabilize object previews that looked broken inside the app.

## Requirements

- Replace the stepped archway body with a polygonal semicircular arch.
- Keep the archway as a two-cell-tall, 10mm-thick hollow panel.
- Keep archway STL output closed and manifold.
- Avoid duplicate faces where arch columns meet the arch ring.
- Improve in-app rendering for roof corner and chimney previews.
- Keep the existing STL behavior for roof corner, chimney, road, and river.

## Acceptance Checks

- STL tests verify the archway remains manifold.
- STL tests verify the archway opening is hollow below the arch and solid at the arch ring.
- Build checks pass.
- Visual smoke confirms the app canvas renders and all material/shape controls load.
- macOS portable package builds successfully.
