# Model 3D Print

Production desktop app project for a Minecraft-like voxel modeling environment that can export textured, rounded-edge STL models for 3D printing.

## Development

- `npm run start`: open the macOS Electron app.
- `npm run build:check`: run syntax checks and core model/STL tests.
- `npm run package:mac`: build the portable macOS zip.

## Web Version

- `npm run web:build`: build the static HTML version into `dist/web`.
- `npm run web:serve`: preview `dist/web` at `http://127.0.0.1:4178/`.
- `npm run web:smoke`: serve `dist/web` over local HTTP and verify the web adapter, WebGL, and tablet touch layout.

The web build keeps the same modeling UI. In a browser, project files are opened with the file picker and saved as downloads; STL export downloads a `.stl` file directly.
Open the web build through `http://` or `https://`; directly double-clicking `dist/web/index.html` uses `file://`, which blocks the module-based modeling engine in many browsers.

GitHub Pages deployment is configured in `.github/workflows/pages.yml`. After this project is pushed to a GitHub repository with Pages enabled for GitHub Actions, the workflow will publish `dist/web`.

Workflow status:

- `00_project_repository_setup`: complete.
- `01_requirements_intake`: complete.
- `02_desktop_app`: complete.
- `03_static_web_version`: initial build complete.
