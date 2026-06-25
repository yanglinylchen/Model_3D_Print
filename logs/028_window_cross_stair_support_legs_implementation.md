# Implementation Log - 028 Window Cross Stair Support Legs

## Summary

Added STL-only support legs for `window_cross` / `十字方框` when it sits directly above a `stair_step` / `樓梯`.

## Geometry Notes

- App preview geometry is unchanged.
- Standalone window crosses still export as the original hollow 10mm-thick panel.
- When the bottom neighbor is a stair step, STL output adds three hidden support legs:
  - left side post
  - center vertical bar
  - right side post
- The legs extend from just below the lower stair tread height to slightly inside the window bottom, creating a stronger slicer-safe connection.
- Existing bottom weld remains, but the legs are now the primary connection to avoid the window shell being treated as floating or transparent by the slicer.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The regression test now checks that a window cross above a stair step includes support legs down to the lower stair tread while staying manifold. The macOS portable zip was rebuilt and checked.
