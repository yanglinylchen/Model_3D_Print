# Implementation Log - 038 Fix Web Shape Icon Paths

## Summary

Fixed broken shape icon paths in the web build.

## Diagnosis

The shape icon URLs were built from a string path relative to the document. In the desktop app, `index.html` lives next to `renderer.js`, so `../../assets` works. In the static GitHub Pages build, the root `index.html` loads `src/renderer/renderer.js`, so the same string escaped the repository path and icons appeared as missing images.

## Implementation Notes

- Changed the asset base to `new URL("../../assets/", import.meta.url).href`.
- Shape icons and example project paths now resolve relative to `renderer.js`, not relative to the HTML document.
- Updated touch and web smoke tests to wait for SVG icon image loads and verify all seven SVG shape icons have a non-zero natural width.

## Verification

- `npm run build:check`
- `npm run web:build`
- `npm run touch:smoke`
- `npm run web:smoke`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The touch and web smoke outputs confirmed `touchShapeLoadedImages: 7`, matching the seven SVG icons in `assets/shape_icons`.
