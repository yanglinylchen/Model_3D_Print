# Implementation Log - 010 Selection Mode and Shortcuts

## Summary

Added explicit mouse modes so users can switch between building and selecting existing blocks. Also added a direct `R` keyboard shortcut for rotation while keeping Delete and Backspace for clearing selected blocks.

## Interaction Notes

- `放置` mode keeps the previous face-click behavior for fast building.
- `選取` mode makes mouse clicks select existing blocks without placing adjacent blocks.
- Shift-click in placement mode still selects the clicked block as a quick override.
- `R` rotates the selected block, or rotates the pending placement angle when nothing is selected.
- Delete and Backspace clear the selected block or cursor block.
- Text inputs and selects ignore these editing shortcuts so workspace dimension editing remains normal.

## Verification

- `npm test`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

All checks passed, and a fresh macOS portable zip was built successfully.
