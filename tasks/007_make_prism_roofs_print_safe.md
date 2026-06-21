# Task 007: Make Prism Roofs Print Safe

## User Problem

Slicers still reported non-manifold edges, especially around triangular prism roof blocks. The issue appeared more often with triangular blocks than square blocks.

## Root Cause

Cube-to-cube contact is full-face contact, so shared faces can be safely removed. Triangular prisms often touch cubes or other prisms along partial faces or exact edges. Those edge-only or partial contacts are fragile in STL triangle soup and can be reported as non-manifold.

## Goals

- Prioritize printable, slicer-safe STL output over material relief in STL.
- Keep brick/plain material appearance in the app preview.
- Export brick cubes as clean print-safe shells, without separate relief shells.
- Only remove shared faces for cube-to-cube full-face contact.
- Add a small prism weld overlap when prisms have neighbors, avoiding exact edge-only contact.
- Cover cube-prism side contact with tests.

## Acceptance Checks

- Unit tests confirm brick STL is shell-only and manifold.
- Unit tests confirm cube next to triangular prism has no non-manifold edges and uses weld overlap.
- Build, visual smoke, package, and packaged smoke all pass.
