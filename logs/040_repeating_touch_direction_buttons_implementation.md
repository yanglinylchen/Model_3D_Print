# 040 Repeating Touch Direction Buttons Implementation

## Summary

Added press-and-hold repeat behavior for tablet/web directional controls.

## Changes

- Touch cursor direction buttons now move one grid cell immediately, then repeat while held.
- Touch layer up/down buttons use the same repeat behavior.
- The right-side view pan pad now pans once immediately, then repeats while held.
- Click behavior remains intact for keyboard/mouse activation, while pointer-based taps suppress the follow-up click to avoid double movement.
- Touch and web smoke checks now verify that holding a cursor direction button moves farther than a single tap.

## Verification

- `npm run build:check`
- `npm run touch:smoke`
- `npm run web:build`
- `npm run web:smoke`
- `npm run visual:smoke`

