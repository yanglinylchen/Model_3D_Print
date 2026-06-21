import assert from "node:assert/strict";
import test from "node:test";
import { createProject, makeBlock, normalizeProject, setBlock } from "../src/core/model.js";
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

test("cube STL keeps full 50mm block footprint without physical gap", () => {
  const project = createProject({ name: "Footprint" });
  const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "plain" }));
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

test("adjacent cubes share the 50mm boundary instead of exporting a spacing gap", () => {
  let project = createProject({ name: "Adjacent" });
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "plain" })).project;
  project = setBlock(project, makeBlock({ x: 1, y: 0, z: 0, material: "plain" })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  const xValues = [...exported.stl.matchAll(/vertex ([\d.-]+) [\d.-]+ [\d.-]+/g)].map((match) => Number(match[1]));
  assert.ok(xValues.includes(50), "expected adjacent cubes to meet at x=50");
  assert.equal(Math.min(...xValues), 0);
  assert.equal(Math.max(...xValues), 100);
});

test("brick STL export generates dense procedural relief geometry", () => {
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
  assert.ok(exported.triangleCount > 500, `expected dense brick geometry, got ${exported.triangleCount}`);
  assert.ok(exported.stl.includes("vertex 0.5"), "expected 1mm seam recess brick relief vertices");
});

test("available materials are brick and plain only", () => {
  for (const material of ["brick", "plain"]) {
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
    assert.ok(exported.triangleCount > 0, `${material} should export printable geometry`);
  }
});

test("legacy material ids normalize to plain", () => {
  const project = normalizeProject({
    name: "Legacy",
    blocks: [{ x: 0, y: 0, z: 0, shape: "cube", material: "wood", rotation: 0 }]
  });
  assert.equal(project.blocks[0].material, "plain");
});

test("blocks STL export for an empty model", () => {
  const exported = exportAsciiStl(createProject());
  assert.equal(exported.ok, false);
  assert.match(exported.reason, /沒有可輸出/);
});
