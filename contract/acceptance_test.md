# Acceptance Test

Status: draft, awaiting requirements confirmation.

## Draft Acceptance Criteria

- User can create a new workspace with chosen X/Y/Z dimensions.
- Default workspace is `1000mm x 1000mm x 1000mm`.
- User cannot create or resize beyond `10000mm x 10000mm x 10000mm` in the first release.
- User cannot exceed 10000 placed blocks in the first release.
- User can resize the workspace after placing blocks.
- If resizing smaller would exclude existing blocks, the app warns the user and does not shrink the workspace.
- User can save, reopen, and autosave a native project.
- Native project files use the `.m3dp` extension.
- Autosave runs once per minute.
- On restart, the app prompts to recover autosaved work when autosave is newer than the last explicit save.
- User can rotate/orbit the camera and place blocks using supported mouse/keyboard controls.
- User can undo and redo up to 50 edit steps.
- User can delete/erase blocks.
- User can select an existing block and change its material.
- User can copy and paste one block, preserving its material and generated texture state.
- User can select brick, wood, stone slab, and wool block materials.
- User can place cube blocks plus 30-degree and 45-degree triangular prism roof blocks.
- Triangular prism blocks occupy a full grid cell and cannot be overlapped with another triangular prism in the same cell.
- A 30-degree triangular prism reaches about `28.87mm` height inside a `50mm` cell.
- The app blocks direct placement above a 30-degree triangular prism and shows a warning unless the upper block has front/back/left/right/top support from another occupied block.
- The app applies the same direct-above support restriction above a 45-degree triangular prism.
- Triangular prism blocks can use every supported material.
- User can rotate directional materials and triangular prism blocks.
- User can press an organize/alignment button to align neighboring same-material block orientations.
- If alignment may change texture direction or apparent random texture arrangement, the app warns before applying it.
- Placed blocks display material-specific visual previews.
- Exported STL includes real rounded block edges.
- Rounded block edges use the `1.5mm` default radius.
- Adjacent-block seams use the `1.0mm` default recessed depth.
- Exported STL includes printable relief texture geometry for each material.
- Default relief depths are brick `2.4mm`, stone slab `2.4mm`, wood grain `1.6mm`, and wool `1.2mm`.
- Relief texture features are no smaller than `0.5mm` and no larger than `10mm`.
- Exported STL includes relief texture only on exposed faces.
- Exported STL is one combined model file.
- Exported STL is not a flat-cube representation; material texture relief is present in the mesh geometry.
- STL export attempts safe automatic repair/optimization before final validation.
- Exported STL is watertight/manifold, or export is blocked with a clear reason if repair cannot make the mesh valid.
- Exported STL represents the model as closed solid volumes, not hollow open shells.
- Multiple placed blocks retain visible boundary/seam detail in the exported mesh.
- Repeated placement of natural materials produces varied texture patterns that become stable after placement.
- Copy/paste preserves the copied block's exact generated texture.
- STL export can be opened by a standard slicer or mesh viewer.
- Built-in finished example projects are available from the app.
- Destructive actions use child-education guardrails such as clear confirmation and undo recovery.
