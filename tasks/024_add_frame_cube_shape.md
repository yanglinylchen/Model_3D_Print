# Task 024 - Add Frame Cube Shape

## Goal

Add a hollow one-cell cube shape that contains only the outer edges with 5mm edge thickness.

## Requirements

- Add a new selectable shape labeled `框架方塊`.
- The shape occupies one regular 50mm grid cell.
- The shape keeps only the 12 cube edges.
- Edge thickness is 5mm.
- The center and face interiors stay hollow.
- App preview geometry and STL output geometry match.
- STL output remains closed and manifold.

## Acceptance Checks

- Model tests verify the frame cube occupies one grid cell.
- STL tests verify the frame cube bounds, 5mm/45mm inner edge positions, hollow center, solid edge, and manifold output.
- Smoke checks verify the shape dropdown includes the new shape.
- macOS portable package builds successfully.
