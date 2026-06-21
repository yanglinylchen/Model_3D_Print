# Interface Concept

The first screen is the editor itself.

## Structure

- Top toolbar handles project, edit, block operations, and STL export.
- Left panel chooses material, block shape, and examples.
- Center viewport is the active 3D modeling space.
- Right inspector shows selected block, workspace dimensions, autosave, and export health.
- Bottom status bar reports coordinates, block count, and warnings.

## Interaction Model

Users choose a material and shape, then place blocks in the grid. The placement cursor can be moved by arrow keys or mouse targeting. Camera control uses WASD, mouse wheel, right-drag orbit, and optional on-screen camera buttons.

Changing a block material happens after selecting an existing block. Copy/paste preserves material, shape, rotation, and exact generated texture instance.

Material direction alignment is a deliberate button action. If the operation changes texture direction or apparent randomness, the app warns before applying it.

## Export Model

The export panel explains STL readiness as a sequence:

1. Generate geometry.
2. Remove hidden/internal faces.
3. Apply relief and seams.
4. Repair mesh.
5. Validate watertight/manifold.
6. Save STL.

The user only sees actionable status text, not CAD jargon unless necessary.

