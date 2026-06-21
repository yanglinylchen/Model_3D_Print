# Task 021 - Fill Archway Upper Panel

## Goal

Refine the archway so the lower door opening remains rounded while the upper outer area is filled for stacking blocks above it.

## Requirements

- Keep the archway lower opening as a polygonal rounded arch.
- Fill the area above and beside the rounded opening up to the full two-cell rectangular bounds.
- Preserve the 10mm panel thickness.
- Avoid internal duplicate faces where side posts meet the filled upper panel.
- Keep app preview geometry and STL geometry visually consistent.
- Keep exported STL closed and manifold.

## Acceptance Checks

- STL tests verify the archway opening remains hollow.
- STL tests verify the upper arch center is solid above the rounded opening.
- STL tests verify the upper corners are filled for stacking.
- Build, visual smoke, package, and packaged smoke checks pass.
