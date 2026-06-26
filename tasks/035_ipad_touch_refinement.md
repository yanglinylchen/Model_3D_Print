# Task 035 - iPad Touch Refinement

## Goal

Improve the deployed web app after direct iPad testing.

## Requirements

- Make the on-screen D-pad move the cursor relative to the current screen view.
- Preserve vertical layer movement.
- Improve Safari tablet layout so the bottom shape bar is not covered by browser UI or safe-area insets.
- Keep desktop, packaged, and web smoke checks passing.

## Acceptance Checks

- D-pad horizontal movement uses projected screen direction instead of fixed world axes.
- Touch shape bar has extra bottom clearance on tablet layouts.
- Static web build and smoke checks pass.
