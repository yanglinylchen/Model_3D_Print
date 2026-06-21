# Asset Manifest

## Gate Result

Pass. Required first-release visual assets are present or explicitly procedural.

## Usage Rules

- Coding agent must use the listed SVG assets for UI previews and icons.
- Coding agent must not use bitmap/image texture maps for STL output.
- STL material relief must be generated as mesh geometry from procedural rules.
- SVG material previews are visual UI hints only.
- Example `.m3dp` files are seed content for the finished examples launcher and may be migrated if the project schema changes.
- If implementation needs any additional visual asset, coding must update this manifest or raise a gap before inventing a new visual style.

## Material Preview Assets

| Asset | Path | Format | Size | States | Usage |
| --- | --- | --- | --- | --- | --- |
| Brick preview | `assets/material_previews/brick.svg` | SVG | 128x128 | default | Material swatch and selected material preview. |
| Wood preview | `assets/material_previews/wood.svg` | SVG | 128x128 | default | Material swatch and selected material preview. |
| Stone slab preview | `assets/material_previews/stone_slab.svg` | SVG | 128x128 | default | Material swatch and selected material preview. |
| Wool preview | `assets/material_previews/wool.svg` | SVG | 128x128 | default | Material swatch and selected material preview. |

## Shape Icon Assets

| Asset | Path | Format | Size | States | Usage |
| --- | --- | --- | --- | --- | --- |
| Cube icon | `assets/shape_icons/cube.svg` | SVG | 64x64 | default, selected via UI styling | Shape selector. |
| 30-degree prism icon | `assets/shape_icons/prism_30.svg` | SVG | 64x64 | default, selected via UI styling | Shape selector and placement warning context. |
| 45-degree prism icon | `assets/shape_icons/prism_45.svg` | SVG | 64x64 | default, selected via UI styling | Shape selector and placement warning context. |

## Status Icon Assets

| Asset | Path | Format | Size | States | Usage |
| --- | --- | --- | --- | --- | --- |
| Autosave icon | `assets/status_icons/autosave.svg` | SVG | 32x32 | saved, recovery available via UI text | Autosave status and recovery prompt. |
| Warning icon | `assets/status_icons/warning.svg` | SVG | 32x32 | warning | Placement, workspace, alignment, and export warnings. |
| Export ready icon | `assets/status_icons/export_ready.svg` | SVG | 32x32 | ready/success | STL validation success. |
| Export blocked icon | `assets/status_icons/export_blocked.svg` | SVG | 32x32 | blocked/error | STL export blocked after failed repair. |
| Mesh repair icon | `assets/status_icons/mesh_repair.svg` | SVG | 32x32 | running/in progress | Repair/optimization progress. |

## Finished Example Assets

| Asset | Path | Format | Size | States | Usage |
| --- | --- | --- | --- | --- | --- |
| Small House | `assets/examples/small_house.m3dp` | JSON draft `.m3dp` | small model | loadable | Finished example project. |
| Stone Bridge | `assets/examples/stone_bridge.m3dp` | JSON draft `.m3dp` | small model | loadable | Finished example project. |
| Classroom Sign | `assets/examples/classroom_sign.m3dp` | JSON draft `.m3dp` | small model | loadable | Finished example project. |
| Tower Wall | `assets/examples/tower_wall.m3dp` | JSON draft `.m3dp` | small model | loadable | Finished example project. |

## Procedural Runtime Assets

These are required by design but intentionally generated in code:

- 3D block meshes.
- Rounded block edge geometry with default `1.5mm` radius.
- Adjacent block seam/gap geometry with default `1.0mm` recessed depth.
- Material relief geometry:
  - Brick: `2.4mm`.
  - Stone slab: `2.4mm`.
  - Wood grain: `1.6mm`.
  - Wool: `1.2mm`.
- Per-block random texture instance data.
- Exposed-face relief selection.
- STL repair/optimization and validation status messages.

## Responsive Constraints

- Material swatches should render at 72px minimum in the left panel and may scale up to 96px.
- Shape icons should render at 24px to 40px in compact controls and 64px in larger selectors.
- Status icons should render at 16px to 24px in status bars and 32px in dialogs.
- SVG assets must remain crisp on retina displays.

## Missing Or Deferred Assets

- No guided interactive tutorial assets for the first release.
- No imported custom material assets.
- No Windows/Linux packaging art.
- No bitmap texture maps for STL export.

## Acceptance Notes

- `xmllint --noout` must pass for every SVG asset.
- Example `.m3dp` files must parse as JSON.
- Future implementation may revise the `.m3dp` schema, but must migrate or regenerate these examples rather than silently dropping them.

