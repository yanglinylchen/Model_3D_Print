# Task 006: Fix Plain And Prism Non-Manifold STL

## User Problem

Plain blocks and triangular prism blocks could be reported by slicers as non-manifold, causing parts of the model to be treated as missing.

## Root Causes

- Plain blocks exported a separate surface relief shell, which touched the base cube and could create non-manifold edges.
- Adjacent blocks exported their shared internal faces, creating overlapping/coplanar internal geometry.
- Triangular prism blocks needed shared bottom/end faces removed when joined to neighboring blocks.

## Goals

- Plain cubes export as clean cuboid surfaces without relief shells.
- Adjacent cubes remove shared internal faces.
- Plain cube plus prism roof exports as a closed manifold shell.
- Prism rows remove shared end faces and stay manifold.
- Smoke tests start from a clean project, unaffected by previous autosave data.

## Acceptance Checks

- Unit tests include edge-incidence manifold checks.
- Plain cube, adjacent plain cubes, cube plus prism roof, and prism roof rows have no non-manifold edges.
- Build, visual smoke, package, and packaged smoke all pass.
