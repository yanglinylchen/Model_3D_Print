# Task 036 - Two Finger View Gestures

## Goal

Add missing iPad two-finger view controls for the web/tablet interface.

## Requirements

- Keep one-finger drag as camera rotation.
- Add two-finger drag to pan the camera target relative to the current view.
- Add two-finger pinch to zoom in and out.
- Prevent two-finger gestures from accidentally placing blocks.
- Keep desktop mouse behavior and packaged app checks passing.

## Acceptance Checks

- Touch smoke dispatches a two-finger gesture without errors.
- Web smoke dispatches the same gesture against the static web build.
- Existing model/STL checks pass.
