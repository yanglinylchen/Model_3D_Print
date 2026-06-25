# Task 026 - Window On Stair Weld

## Goal

Prevent slicer non-manifold or floating-shell warnings when a window cross is placed above a stair step.

## Requirements

- Keep the window cross visible shape unchanged in the app.
- Keep standalone window STL dimensions unchanged.
- When the window cross has any block directly below it, slightly overlap its bottom rail downward for STL output.
- Preserve the hollow window openings.
- Keep STL output manifold in automated checks.

## Acceptance Checks

- A stair step with a window cross directly above exports successfully.
- The exported STL contains a tiny support overlap below `z=50`.
- Existing STL tests continue to pass.
