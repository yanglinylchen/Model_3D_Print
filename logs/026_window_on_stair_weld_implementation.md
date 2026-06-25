# Implementation Log - 026 Window On Stair Weld

## Summary

Adjusted STL output for `window_cross` / `窗框` when it is stacked directly above another block.

## Geometry Notes

- Standalone window crosses still export from `z` to `z + 50mm`.
- When a window cross has a bottom neighbor, only its bottom row extends downward by `0.08mm`.
- This creates a tiny print-safe overlap with the support below, avoiding exact coplanar contact at the support boundary.
- App preview geometry is unchanged.
- Window openings remain hollow because the change only affects occupied bottom-row cells.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The new regression test covers a stair step with a window cross directly above it and verifies the exported STL stays manifold and includes the small support overlap below `z=50`. The macOS portable zip was rebuilt and checked.
