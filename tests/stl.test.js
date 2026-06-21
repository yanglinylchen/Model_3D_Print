import assert from "node:assert/strict";
import test from "node:test";
import { createProject, makeBlock, normalizeProject, setBlock } from "../src/core/model.js";
import { exportAsciiStl } from "../src/core/stl.js";

test("exports non-empty ASCII STL for a simple cube", () => {
  const project = createProject({ name: "Cube STL" });
  const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "plain" }));
  assert.equal(placed.ok, true);

  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.match(exported.stl, /^solid Cube_STL/);
  assert.match(exported.stl, /facet normal/);
  assert.equal(exported.triangleCount, 12);
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
  assert.equal(Math.min(...xValues), 0);
  assert.equal(Math.max(...xValues), 100);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("plain cubes do not export relief shells that create non-manifold edges", () => {
  const project = createProject({ name: "Plain Cube" });
  const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "plain" }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.equal(exported.triangleCount, 12);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("plain cube with plain prism roof exports as closed manifold shell", () => {
  let project = createProject({ name: "Plain Roof" });
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "plain" })).project;
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 1, shape: "prism_45", material: "plain" })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("plain prism roof row exports as closed manifold shell", () => {
  let project = createProject({ name: "Plain Roof Row", workspaceCells: { x: 4, y: 4, z: 4 } });
  for (let y = 0; y < 2; y += 1) {
    project = setBlock(project, makeBlock({ x: 0, y, z: 0, material: "plain" })).project;
    project = setBlock(project, makeBlock({ x: 0, y, z: 1, shape: "prism_45", material: "plain" })).project;
  }
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("brick cube STL exports side-only relief as closed printable shells", () => {
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
  assert.ok(exported.triangleCount > 12);
  const vertices = verticesFromStl(exported.stl);
  const minX = Math.min(...vertices.map((vertex) => vertex.x));
  const maxX = Math.max(...vertices.map((vertex) => vertex.x));
  const minY = Math.min(...vertices.map((vertex) => vertex.y));
  const maxY = Math.max(...vertices.map((vertex) => vertex.y));
  const maxZ = Math.max(...vertices.map((vertex) => vertex.z));
  assert.equal(maxZ, 50, "brick relief should not appear on the top face");
  assert.ok(minX < 0 || maxX > 50 || minY < 0 || maxY > 50, "side relief should protrude from exposed vertical faces");
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("brick cube with roof does not export top relief under triangular prism", () => {
  let project = createProject({ name: "Roof Safe Brick", workspaceCells: { x: 3, y: 3, z: 3 } });
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, material: "brick", textureSeed: "roof-safe" })).project;
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 1, shape: "prism_45", material: "plain" })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(vertices.some((vertex) => vertex.z === 49.4));
  assert.ok(!vertices.some((vertex) => vertex.z > 50 && vertex.z < 51), "no brick relief should sit between cube top and roof prism");
});

test("cube next to triangular prism uses weld overlap instead of edge-only contact", () => {
  let project = createProject({ name: "Side Roof", workspaceCells: { x: 4, y: 4, z: 4 } });
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 1, material: "brick" })).project;
  project = setBlock(project, makeBlock({ x: 1, y: 0, z: 1, shape: "prism_45", material: "plain" })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const xValues = [...exported.stl.matchAll(/vertex ([\d.-]+) [\d.-]+ [\d.-]+/g)].map((match) => Number(match[1]));
  assert.ok(Math.max(...xValues) > 100, "expected prism weld overlap to avoid exact edge-only contact");
});

test("brick triangular prisms export clean prism geometry without cube relief", () => {
  for (const shape of ["prism_30", "prism_45"]) {
    const project = createProject({ name: `${shape} STL` });
    const placed = setBlock(project, makeBlock({
      x: 0,
      y: 0,
      z: 0,
      shape,
      material: "brick",
      textureSeed: `${shape}-brick-seed`
    }));
    const exported = exportAsciiStl(placed.project);
    assert.equal(exported.ok, true);
    assert.equal(exported.triangleCount, 8, `${shape} should not include cube relief boxes`);

    const vertices = verticesFromStl(exported.stl);
    const maxZ = Math.max(...vertices.map((vertex) => vertex.z));
    const expectedMaxZ = shape === "prism_30" ? Math.tan(Math.PI / 6) * 50 : 50;
    assert.equal(Number(maxZ.toFixed(2)), Number(expectedMaxZ.toFixed(2)));
    assert.deepEqual(nonManifoldEdges(exported.stl), []);
  }
});

test("rotated triangular prism STL follows block rotation", () => {
  const project = createProject({ name: "Rotated Prism" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "prism_45",
    material: "plain",
    rotation: 90
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  const vertices = [...exported.stl.matchAll(/vertex ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    z: Number(match[3])
  }));
  assert.ok(vertices.some((vertex) => vertex.x === 0 && vertex.y === 50 && vertex.z === 50));
});

test("window cross STL is a hollow 10mm thick panel inside one cell", () => {
  const project = createProject({ name: "Window Cross" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "window_cross",
    material: "plain"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);

  const vertices = verticesFromStl(exported.stl);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.x)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.x)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.y)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 10);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.z)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50);
  assert.ok(vertices.some((vertex) => vertex.x === 21 && vertex.z === 21), "window should include cross-bar inner corners");
  assert.ok(!vertices.some((vertex) => vertex.x === 12 && vertex.z === 12), "window quadrant should stay hollow");
});

test("rotated window cross STL moves the 10mm panel to another outer side", () => {
  const project = createProject({ name: "Rotated Window" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "window_cross",
    material: "plain",
    rotation: 90
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.x)), 40);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.x)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.y)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 50);
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

function nonManifoldEdges(stl) {
  const vertices = [...stl.matchAll(/vertex ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map((match) => [
    Number(match[1]).toFixed(5),
    Number(match[2]).toFixed(5),
    Number(match[3]).toFixed(5)
  ]);
  const counts = new Map();
  for (let index = 0; index < vertices.length; index += 3) {
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const key = [vertices[index + a].join(","), vertices[index + b].join(",")].sort().join("|");
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count !== 2)
    .map(([key, count]) => `${key}:${count}`);
}

function verticesFromStl(stl) {
  return [...stl.matchAll(/vertex ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    z: Number(match[3])
  }));
}
