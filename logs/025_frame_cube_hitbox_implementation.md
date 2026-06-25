# Implementation Log - 025 Frame Cube Hitbox

## Summary

Added a renderer-only hitbox for the `frame_cube` / `框架方塊` shape.

## Interaction Notes

- The visible frame cube mesh remains hollow and keeps its existing 5mm edge geometry.
- The visible frame cube mesh no longer participates in raycasting.
- A transparent full-cell cube is added as a direct scene pick target for each frame cube.
- The transparent hitbox carries the same block position metadata as the visible shape, so selection and adjacent placement use normal full-cube face normals.
- STL export is unchanged and still uses the hollow frame geometry from the core exporter.

## Verification

- `npm run frame-hitbox:smoke`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The frame cube hitbox smoke confirmed that clicking a frame cube face can place an adjacent frame cube at `1,0,0`. The macOS portable zip was rebuilt and checked.
