# Task 025 - Frame Cube Hitbox

## Goal

Make the hollow frame cube behave like a full cube for mouse picking and adjacent placement.

## Requirements

- Keep the frame cube preview and STL output hollow.
- Allow users to click the frame cube as if it had full cube faces.
- Adjacent placement from the top, bottom, left, right, front, and back should use regular cube face normals.
- Do not change the exported STL geometry.

## Acceptance Checks

- Renderer uses a transparent full-cell hitbox for frame cube interaction.
- The visible frame geometry does not block or distort picking.
- Existing build, smoke, and package checks continue to pass.
