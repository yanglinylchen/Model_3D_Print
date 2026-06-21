# Task 004: Refine Material Scope, Seams, And Placement

## User Problem

The non-brick material relief was not good enough, adjacent cubes appeared physically separated, camera pitch did not cover pure vertical view movement, and mouse placement could not naturally stack blocks on top of existing blocks.

## Goals

- Limit available materials to brick and plain/no-material.
- Keep old project/example files loadable by mapping removed material ids to plain.
- Make adjacent cubes export as physically touching solid geometry.
- Represent seams as a recessed/inset edge area rather than an actual 1mm spacing gap.
- Add a keyboard shortcut for pure vertical camera movement.
- Make mouse placement use the face under the cursor as the next placement origin.

## Acceptance Checks

- Unit tests confirm adjacent cubes share the 50mm boundary.
- Unit tests confirm legacy material ids normalize to plain.
- Visual smoke places one block, clicks its face, and gets a second stacked/adjacent block.
- Packaged smoke confirms the packaged app has exactly two material controls and can place the second block.
