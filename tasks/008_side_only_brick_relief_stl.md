# Task 008 - Side-only Brick Relief STL

## Goal

Restore visible brick relief in STL export without reintroducing slicer non-manifold issues around triangular prism roof blocks.

## Decisions

- Keep STL as the primary export for this iteration.
- Note that 3MF can preserve richer print metadata later, but it does not automatically fix bad mesh geometry.
- Emit brick relief only on exposed vertical cube sides.
- Do not emit brick relief on cube top or bottom faces.
- Do not emit brick relief for triangular prism blocks.
- Skip side relief when another block occupies the neighboring cell on that side.
- Build each relief brick as a small closed cuboid embedded slightly into the cube wall so it is more slicer-friendly than coplanar decorative faces.

## Acceptance Checks

- Plain cube STL remains a clean closed block.
- Brick cube STL has visible side relief and no top relief.
- Brick cube with triangular prism roof has no relief between the cube top and roof prism.
- Brick triangular prisms export as clean prism geometry without relief.
- Existing roof/prism non-manifold checks remain passing.
