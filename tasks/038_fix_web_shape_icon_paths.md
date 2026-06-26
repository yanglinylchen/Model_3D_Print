# Task 038 - Fix Web Shape Icon Paths

## Goal

Fix broken shape icons on the deployed GitHub Pages web app.

## Requirements

- Shape icons must load correctly from GitHub Pages under `/Model_3D_Print/`.
- Desktop Electron asset loading must keep working.
- Example project paths should use the same robust asset base.
- Smoke tests should fail if SVG shape icons are present but not actually loaded.

## Acceptance Checks

- Touch smoke confirms all SVG shape icons load.
- Web smoke confirms all SVG shape icons load over HTTP.
- Existing build and packaged checks pass.
