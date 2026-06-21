# Task 010 - Selection Mode and Shortcuts

## Goal

Make placed blocks directly selectable, then provide fast keyboard actions for rotating and deleting selected blocks.

## Requirements

- Add a mouse mode switch for placement versus selection.
- In placement mode, clicking block faces continues to place adjacent blocks.
- In selection mode, clicking an existing block selects it instead of placing a new one.
- Preserve a quick temporary selection path with Shift-click while in placement mode.
- Add a keyboard shortcut for rotation.
- Ensure Delete and Backspace delete the selected block without interfering with text inputs.

## Acceptance Checks

- Visual smoke test places blocks, switches to selection mode, and selects an existing block.
- Block count does not increase while using selection mode.
- The active mode is reflected in the toolbar/status UI.
- Existing model and STL tests continue passing.
