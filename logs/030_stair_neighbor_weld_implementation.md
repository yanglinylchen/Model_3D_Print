# Implementation Log - 030 Stair Neighbor Weld

## Summary

Updated STL generation for `stair_step` / `樓梯` so stair blocks weld more reliably to neighboring blocks.

## Diagnosis

The slicer screenshot shows the window frames behaving correctly after the previous fix, while the problem remains near the stair-step area. The likely cause is exact coplanar contact between stair-step geometry and supporting or neighboring blocks. For example, a stair sitting on a cube previously had both surfaces meeting exactly at `z=50`, which can make slicers treat the pieces as separate touching shells instead of a fused printable solid.

## Geometry Notes

- Standalone stair steps still export within the normal `0..50mm` cell bounds.
- If the stair has a bottom neighbor, the bottom extends downward by `0.35mm`.
- If the stair has a top neighbor, the upper tread extends upward by `0.35mm`.
- If the stair has side neighbors, the matching side extends outward by `0.35mm`.
- Side neighbor detection respects stair rotation.
- The L-shaped stair profile is preserved.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

New regression tests cover a stair on top of a cube and two adjacent stair steps. The macOS portable zip was rebuilt and checked.
