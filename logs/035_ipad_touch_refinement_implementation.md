# Implementation Log - 035 iPad Touch Refinement

## Summary

Refined the web/tablet touch controls after iPad testing.

## Interaction Notes

- Replaced the old camera-angle cursor movement with screen-projected movement.
- The D-pad now evaluates the four neighboring grid cells, projects them into screen space, and chooses the neighbor that best matches the pressed visual direction.
- Layer up/down remains unchanged.

## Layout Notes

- The app now uses `100dvh` where supported so Safari's visible viewport is respected.
- The touch controls use a bottom inset based on `env(safe-area-inset-bottom)` and extra spacing so the shape hotbar sits above browser chrome.

## Verification

- `npm run build:check`
- `npm run web:build`
- `npm run touch:smoke`
- `npm run web:smoke`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The touch and web smoke checks now verify that a horizontal D-pad press moves the cursor after the layer movement check.
