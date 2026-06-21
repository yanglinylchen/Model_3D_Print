# Asset Requirements

## Required Assets

- Procedural material preview thumbnails:
  - Brick.
  - Wood.
  - Stone slab.
  - Wool.
- Shape icons:
  - Cube.
  - 30-degree triangular prism.
  - 45-degree triangular prism.
- Status icons:
  - Autosave.
  - Warning.
  - Export ready.
  - Export blocked.
  - Mesh repair.
- Finished example projects:
  - Small house with roof.
  - Stone bridge.
  - Nameplate or classroom sign.
  - Simple tower/wall.

## Asset Strategy

Use procedural or code-generated previews where possible. Material thumbnails should preview color and relief direction, but the actual STL output must come from mesh geometry, not bitmap images.

No external stock imagery is required for the first release.

## 3D Material Requirements

- Brick relief should show mortar-like grooves and randomized slight edge variation.
- Wood relief should show directional grain with stable per-block randomization.
- Stone slab relief should show natural shallow chipped/stratified variation.
- Wool relief should show soft woven/fibrous relief without very fine features below `0.5mm`.

## Export Asset Rules

- Visual thumbnails may use color.
- STL export does not require color.
- Relief geometry must preserve minimum feature size `0.5mm` and maximum relief size `10mm`.
- Default relief depths:
  - Brick: `2.4mm`.
  - Stone slab: `2.4mm`.
  - Wood grain: `1.6mm`.
  - Wool: `1.2mm`.

## Deferrals

- No guided tutorial assets in the first release.
- No Windows/Linux packaging assets.
- No user-imported texture assets.

