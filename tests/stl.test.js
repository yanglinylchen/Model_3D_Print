import assert from "node:assert/strict";
import test from "node:test";
import { createProject, makeBlock, setBlock } from "../src/core/model.js";
import { exportAsciiStl } from "../src/core/stl.js";

test("exports non-empty ASCII STL for a simple cube", () => {
  const project = createProject({ name: "Cube STL" });
  const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "brick" }));
  assert.equal(placed.ok, true);

  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.match(exported.stl, /^solid Cube_STL/);
  assert.match(exported.stl, /facet normal/);
  assert.ok(exported.triangleCount > 12);
});

test("rounded cube STL keeps full 50mm block footprint without shrink gap", () => {
  const project = createProject({ name: "Footprint" });
  const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "stone_slab" }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  const vertices = [...exported.stl.matchAll(/vertex ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    z: Number(match[3])
  }));
  assert.ok(vertices.some((vertex) => vertex.x === 0));
  assert.ok(vertices.some((vertex) => vertex.y === 0));
  assert.ok(vertices.some((vertex) => vertex.x === 50));
  assert.ok(vertices.some((vertex) => vertex.y === 50));
});

test("material STL export generates dense procedural relief geometry", () => {
  const project = createProject({ name: "Material Relief" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    material: "brick",
    textureSeed: "brick-test-seed"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.ok(exported.triangleCount > 800, `expected dense material geometry, got ${exported.triangleCount}`);
  assert.ok(exported.stl.includes("vertex 1.35"), "expected mortar-offset brick relief vertices");
});

test("all built-in materials export relief above a plain rounded block", () => {
  for (const material of ["brick", "wood", "stone_slab", "wool"]) {
    const project = createProject({ name: `${material} Relief` });
    const placed = setBlock(project, makeBlock({
      x: 0,
      y: 0,
      z: 0,
      material,
      textureSeed: `${material}-test-seed`
    }));
    const exported = exportAsciiStl(placed.project);
    assert.equal(exported.ok, true);
    assert.ok(exported.triangleCount > 500, `${material} should export visible geometric relief`);
  }
});

test("blocks STL export for an empty model", () => {
  const exported = exportAsciiStl(createProject());
  assert.equal(exported.ok, false);
  assert.match(exported.reason, /沒有可輸出/);
});
