# Visual Direction

## Tone

Friendly technical workbench. The app should feel clear, tactile, and printable rather than decorative or game-menu-like.

## Layout

- Full-window modeling workbench.
- Central 3D viewport with visible grid bounds.
- Left tool rail for material and block shape selection.
- Top toolbar for project, undo/redo, copy/paste, erase, rotate, and export.
- Right inspector for selected block, workspace size, autosave state, and mesh/export status.
- Bottom status bar for coordinates, block count, warnings, and autosave timestamp.

## Color

Use a balanced, practical palette:

- Neutral light workspace background.
- Dark charcoal text and icon strokes.
- Material swatches: brick red, wood amber, stone cool gray, wool soft off-white.
- Action accent: blue-green for primary actions.
- Warning: amber.
- Blocking/error: red.
- Success/export-ready: green.

Avoid a one-note palette. The UI should not be dominated by purple, beige, dark slate, or orange/brown.

## Typography

- System UI font.
- Taiwan Traditional Chinese labels.
- Compact headings for panels.
- Larger labels only for primary mode buttons or export status.

## Shape And Controls

- Buttons use 6px to 8px radius.
- Icon buttons for undo, redo, copy, paste, erase, rotate, camera controls, and export.
- Material swatches are square tiles with texture thumbnails and short labels.
- Shape selector uses segmented controls: cube, 30-degree prism, 45-degree prism.
- Numeric workspace inputs use steppers.
- Toggle/checkbox controls for optional helpers.

## 3D Viewport

- Show the editable workspace bounds.
- Show a translucent placement cursor.
- Highlight selected block with a thin outline.
- Use color previews and procedural material hints.
- Keep warnings near the action without covering the placement target.

## Accessibility And Education

- Minimum target size for primary controls: 36px.
- High-contrast warning and blocking states.
- All icon-only controls need tooltips.
- Destructive actions use confirmation and remain undoable.

