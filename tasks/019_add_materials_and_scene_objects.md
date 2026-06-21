# Task 019 - Add Materials and Scene Objects

## Goal

Add metal plate and grid tile materials, plus five scene-building objects requested for the next user testing pass.

## Requirements

- Add `金屬板` material with printable rivets and panel seams.
- Add `格子磁磚` material with printable square tile relief.
- Add `拱門` object as a two-cell-tall hollow arch panel.
- Add `屋頂轉角` object as a one-cell roof corner piece.
- Add `煙囪` object as a one-cell hollow chimney.
- Add `道路` object as a one-cell thin road slab.
- Add `河道` object as a one-cell thin river slab.
- Keep all STL exports closed and manifold.
- Keep the new objects compatible with the existing grid placement model.

## Acceptance Checks

- Model tests verify the new scene objects occupy expected cells.
- STL tests verify metal plate and grid tile relief.
- STL tests verify the new object meshes are closed, manifold, and within their intended bounds.
- Smoke checks verify the material and shape dropdown counts.
- macOS portable package builds successfully.
