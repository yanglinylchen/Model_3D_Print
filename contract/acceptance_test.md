# Acceptance Test

Status: draft, awaiting requirements confirmation.

## Draft Acceptance Criteria

- User can create a new workspace with chosen X/Y/Z dimensions.
- Default workspace is `1000mm x 1000mm x 1000mm`.
- User cannot create or resize beyond `10000mm x 10000mm x 10000mm` in the first release.
- User can resize the workspace after placing blocks.
- If resizing smaller would exclude existing blocks, the app warns the user and does not shrink the workspace.
- User can save, reopen, and autosave a native project.
- User can rotate/orbit the camera and place blocks using supported mouse/keyboard controls.
- User can undo and redo up to 50 edit steps.
- User can delete/erase blocks.
- User can select an existing block and change its material.
- User can copy and paste one block, preserving its material and generated texture state.
- User can select brick, wood, stone slab, and wool block materials.
- User can place cube blocks plus 30-degree and 45-degree triangular prism roof blocks.
- Triangular prism blocks occupy a full grid cell and cannot be overlapped with another triangular prism in the same cell.
- User can rotate directional materials and triangular prism blocks.
- User can choose automatic orientation alignment for neighboring same-material blocks.
- Placed blocks display material-specific visual previews.
- Exported STL includes real rounded block edges.
- Exported STL includes printable relief texture geometry for each material.
- Exported STL includes relief texture only on exposed faces.
- Exported STL is one combined model file.
- Exported STL is not a flat-cube representation; material texture relief is present in the mesh geometry.
- Exported STL is watertight/manifold or export warns/blocks according to the chosen export policy.
- Exported STL represents the model as closed solid volumes, not hollow open shells.
- Multiple placed blocks retain visible boundary/seam detail in the exported mesh.
- Repeated placement of natural materials produces varied but stable texture patterns.
- STL export can be opened by a standard slicer or mesh viewer.
- Built-in examples are available from the app.
