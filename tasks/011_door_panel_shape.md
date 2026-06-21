# Task 011 - Door Panel Shape

## Goal

Add a printable door object that occupies two vertical 50mm grid cells while using the same 10mm panel thickness as the cross window.

## Requirements

- Add a selectable `門` shape.
- Door occupies one X/Y cell and two vertical Z cells.
- Placement must reserve both occupied cells.
- Placement must fail if the door would exceed workspace height.
- Other blocks cannot be placed into the upper occupied cell.
- Door does not count as its own support when placed above restricted triangular prisms.
- Door STL should be 50mm wide, 100mm tall, and 10mm thick.
- Door STL should include visible recessed/raised door-panel details.
- Rotation should move the 10mm panel to another side of the same occupied footprint.

## Acceptance Checks

- Model tests cover two-cell occupancy, overlap prevention, resize prevention, and roof support behavior.
- STL tests cover dimensions, rotation, and non-manifold edge checks.
- Visual smoke verifies all shape controls render.
- Existing tests remain passing.
