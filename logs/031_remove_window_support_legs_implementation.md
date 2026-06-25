# Implementation Log - 031 Remove Window Support Legs

## Summary

Removed STL-only support legs from `window_cross` / `十字方框`.

## Diagnosis

The slicer showed vertical columns below window crosses behaving like negative geometry and cutting into the stair area. Those columns came from the prior `windowCrossStairSupportTriangles` experiment. The approach was too invasive because the support legs intersected the stair volume and could be interpreted poorly by slicers.

## Geometry Notes

- `windowCrossStairSupportTriangles` was removed.
- `window_cross` still keeps the small bottom weld when stacked on a support.
- Adjacent `window_cross` side welds remain.
- Stair neighbor welds remain and should handle stair contact more locally.
- A regression assertion now prevents window crosses from exporting support-leg geometry below the stair top area.

## Verification

- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The macOS portable zip was rebuilt and checked.
