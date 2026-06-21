# Task 015 - Rubble Stone Material

## Goal

Add an irregular stone material inspired by rough stone wall joints, with printable depth rather than a flat image.

## Requirements

- Add a selectable `亂石` material.
- Preview should show irregular stone blocks instead of a flat gray swatch.
- STL export should generate real side relief on exposed cube faces.
- Stone joints should read as recessed seams between uneven stones.
- The pattern must stay fixed after placement and copy/paste because it uses the block texture seed.
- Top and bottom faces should stay flat to avoid roof and triangle-prism print problems.
- Non-cube decorative shapes should not receive this relief in the first pass.
- STL export must remain closed and manifold.

## Acceptance Checks

- Material controls include `亂石`.
- STL tests verify side relief, fixed seeded output, and no top relief.
- Existing non-manifold checks continue passing.
- Visual and packaged smoke checks pass with the new material button.
