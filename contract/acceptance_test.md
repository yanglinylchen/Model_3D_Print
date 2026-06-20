# Acceptance Test

Status: draft, awaiting requirements confirmation.

## Draft Acceptance Criteria

- User can create a new workspace with chosen X/Y/Z dimensions.
- User can resize the workspace after placing blocks.
- If resizing smaller would exclude existing blocks, the app warns the user and does not shrink the workspace.
- User can rotate/orbit the camera and place blocks using supported mouse/keyboard controls.
- User can copy and paste blocks.
- User can select brick, wood, stone slab, and wool block materials.
- Placed blocks display material-specific visual previews.
- Exported STL includes real rounded block edges.
- Exported STL includes printable relief texture geometry for each material.
- Exported STL is one combined model file.
- Exported STL is not a flat-cube representation; material texture relief is present in the mesh geometry.
- Multiple placed blocks retain visible boundary/seam detail in the exported mesh.
- Repeated placement of natural materials produces varied but stable texture patterns.
- STL export can be opened by a standard slicer or mesh viewer.
