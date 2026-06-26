# Implementation Log - 034 Static Web Version

## Summary

Added a static web build path for Model 3D Print.

## Implementation Notes

- Added `src/renderer/web-adapter.js` to provide the same `window.model3d` API in browsers.
- The browser adapter opens `.m3dp` files with a file picker and saves `.m3dp` / `.stl` files as downloads.
- Added `scripts/build_web.mjs` to copy the shared renderer, core modules, assets, and Three.js build files into `dist/web`.
- The generated root `dist/web/index.html` points at the copied renderer files and can be served as a static site.
- Added an Electron-Chromium based web smoke test that serves `dist/web` over local HTTP and verifies the web adapter, WebGL, tablet layout, and touch shape bar.
- Added a GitHub Pages workflow that builds `dist/web` and deploys it through GitHub Actions.

## Verification

- `npm run build:check`
- `npm run web:build`
- `npm run web:smoke`
- `npm run visual:smoke`
- `npm run touch:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The static web build is available at `dist/web`, and the macOS portable zip was rebuilt.
