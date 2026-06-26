# Task 037 - Touch Controls Accessibility

## Goal

Make the iPad/web controls expose the same core editing options as the desktop side panels.

## Requirements

- Provide touch access to material selection.
- Provide touch access to workspace X/Y/Z resizing.
- Convert the touch shape bar from text buttons to icon-style controls.
- Reduce accidental Safari double-tap zoom.
- Keep desktop, web, and packaged smoke checks passing.

## Acceptance Checks

- Touch material bar renders all materials and can select one.
- Touch workspace panel can resize the workspace.
- Touch shape bar renders icon/glyph controls for every shape.
- Web smoke verifies the same controls in the static build.
