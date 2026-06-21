# Task 014 - Fence Panel Shape

## Goal

Add a fence component that occupies one normal 50mm grid cell and sits on the outer side of that cell as a 10mm thick hollow panel.

## Requirements

- Add a selectable `柵欄` shape.
- The fence occupies one grid cell.
- The fence is 10mm thick.
- The visible shape should read as a fence with posts and rails, with hollow openings.
- Rotation should change which side of the cell the fence sits on.
- The fence should not receive material relief, even when a material is selected.
- STL export must remain closed and manifold.

## Acceptance Checks

- Model tests can place a fence block in one grid cell.
- STL tests verify the fence bounds and 10mm thickness.
- STL tests verify the hollow gaps, posts, and rails.
- STL tests verify brick selection does not add material relief.
- Existing visual and packaged smoke checks include the new shape button.
