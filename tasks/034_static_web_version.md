# Task 034 - Static Web Version

## Goal

Create a static HTML/web build of Model 3D Print that can be hosted on GitHub Pages and used from an iPad browser.

## Requirements

- Keep the existing Electron desktop app working.
- Reuse the existing renderer and core modeling/STL code.
- Add a browser adapter for project open/save and STL export.
- Build a self-contained static output under `dist/web`.
- Validate the static output over HTTP, not only as copied files.
- Add GitHub Pages deployment workflow.

## Acceptance Checks

- `npm run web:build` creates `dist/web/index.html`.
- Web version installs `window.model3d.platform === "web"`.
- Web version initializes WebGL.
- Tablet layout and touch shape bar work in the static web build.
- Existing core build checks pass.
