# Task 003: Improve Procedural Material Relief

## User Problem

The exported STL material relief looked like a few rectangular strips pasted onto cubes instead of believable printable material texture.

## Goals

- Replace sparse strip-based STL relief with denser procedural geometric relief.
- Make brick, wood, stone slab, and wool visibly different in slicers.
- Keep texture deterministic per block texture seed so copy/paste preserves the exact pattern.
- Preserve STL validation and existing rounded-block footprint behavior.

## Acceptance Checks

- Unit tests confirm dense material geometry is generated.
- All built-in materials export relief geometry above a plain rounded block.
- Build check passes.
- Electron visual smoke still passes.
- macOS package and packaged smoke still pass.
