# Implementation Log - 015 Rubble Stone Material

## Summary

Added a `rubble_stone` material labeled `亂石`. It previews as irregular stone blocks and exports printable side relief for cube blocks.

## Geometry Notes

- The base cube remains a solid 50mm body.
- Exposed vertical cube faces receive seeded raised stone plates.
- Gaps between the raised plates expose the lower base surface, creating the recessed joint effect.
- Pattern generation is deterministic from `textureSeed`, so placed blocks keep their stone layout and copy/paste preserves it.
- Relief is side-only and skipped for top, bottom, triangular prisms, doors, windows, fences, and stairs in this first pass.
- Relief plates are closed cuboids with a small embed depth, matching the existing print-safe brick relief strategy.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
