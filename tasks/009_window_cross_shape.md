# Task 009 - Cross Window Shape

## Goal

Add a creative printable window object that occupies a normal 50mm grid cell but only creates a thin hollow cross-frame panel on the outer side of that cell.

## Requirements

- Add a new selectable shape named `十字窗`.
- The shape occupies the same grid footprint as any other block.
- The STL mesh should be hollow through the four panes, leaving only the outer frame and cross bars.
- The window panel should be 10mm thick.
- Rotation should move the panel to another side of the same grid cell.
- The mesh must export as closed printable STL geometry without non-manifold edges.

## Acceptance Checks

- Window blocks normalize and place like other shapes.
- App preview renders the window as a thin cross-frame object.
- STL bounds are 50mm x 50mm for the window face and 10mm thick.
- Rotated window STL moves the 10mm thickness to a different side.
- Existing STL and roof tests remain passing.
