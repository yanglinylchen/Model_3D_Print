# Implementation Log - 019 Add Materials and Scene Objects

## Summary

Added two materials and five objects:

- `metal_plate` / `金屬板`
- `grid_tile` / `格子磁磚`
- `archway` / `拱門`
- `roof_corner` / `屋頂轉角`
- `chimney` / `煙囪`
- `road` / `道路`
- `river` / `河道`

## Geometry Notes

- Metal plate relief uses separated panel seam segments and rivets so raised pieces do not share exact edges.
- Grid tile relief uses repeated raised square tiles with recessed grout gaps.
- Archway exports as a 10mm thick two-cell panel with a hollow arch opening.
- Roof corner exports as a one-cell 45-degree corner roof volume.
- Chimney exports as a one-cell hollow square tube.
- Road and river export as thin one-cell slabs; both include simple raised details for print-visible surface cues.
- Road and river preview colors are fixed by shape, independent of selected material.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
