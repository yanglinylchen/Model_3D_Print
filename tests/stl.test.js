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

test("rubble stone cube STL exports irregular side relief without top relief", () => {
  const project = createProject({ name: "Rubble Stone" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    material: "rubble_stone",
    textureSeed: "rubble-test-seed"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.ok(exported.triangleCount > 12);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);

  const vertices = verticesFromStl(exported.stl);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50, "rubble relief should not appear on the top face");
  assert.ok(
    Math.min(...vertices.map((vertex) => vertex.x)) < 0
      || Math.max(...vertices.map((vertex) => vertex.x)) > 50
      || Math.min(...vertices.map((vertex) => vertex.y)) < 0
      || Math.max(...vertices.map((vertex) => vertex.y)) > 50,
    "rubble side stones should protrude from exposed vertical faces"
  );

  const exportedAgain = exportAsciiStl(placed.project);
  assert.equal(exported.stl, exportedAgain.stl, "rubble pattern should stay fixed after placement");

  const brickProject = createProject({ name: "Rubble Compare" });
  const brickPlaced = setBlock(brickProject, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    material: "brick",
    textureSeed: "rubble-test-seed"
  }));
  const brickExported = exportAsciiStl(brickPlaced.project, "same_name");
  const rubbleExported = exportAsciiStl(placed.project, "same_name");
  assert.notEqual(rubbleExported.triangleCount, brickExported.triangleCount, "rubble should not export the same relief as brick");
  assert.ok(rubbleExported.triangleCount > brickExported.triangleCount, "rubble should use irregular polygon stones instead of brick cuboids");
});

test("metal plate cube STL exports rivet and panel relief", () => {
  const project = createProject({ name: "Metal Plate" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    material: "metal_plate",
    textureSeed: "metal-test-seed"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.ok(exported.triangleCount > 12);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(Math.max(...vertices.map((vertex) => vertex.z)) > 50, "metal rivets should appear on exposed top faces");
  assert.ok(Math.min(...vertices.map((vertex) => vertex.x)) < 0 || Math.max(...vertices.map((vertex) => vertex.y)) > 50, "metal relief should appear on exposed side faces");
});

test("grid tile cube STL exports square tile relief", () => {
  const project = createProject({ name: "Grid Tile" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    material: "grid_tile",
    textureSeed: "grid-test-seed"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.ok(exported.triangleCount > 12);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(Math.max(...vertices.map((vertex) => vertex.z)) > 50, "grid tiles should appear on exposed top faces");
  assert.ok(Math.min(...vertices.map((vertex) => vertex.x)) < 0 || Math.max(...vertices.map((vertex) => vertex.y)) > 50, "grid tiles should appear on exposed side faces");
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

test("roof tile triangular prisms export printable relief only on the slope", () => {
  for (const shape of ["prism_30", "prism_45"]) {
    const project = createProject({ name: `${shape} Roof Tile` });
    const placed = setBlock(project, makeBlock({
      x: 0,
      y: 0,
      z: 0,
      shape,
      material: "roof_tile",
      textureSeed: `${shape}-roof-tile`
    }));
    const exported = exportAsciiStl(placed.project);
    assert.equal(exported.ok, true);
    assert.ok(exported.triangleCount > 8, `${shape} should include roof tile relief plates`);
    assert.deepEqual(nonManifoldEdges(exported.stl), []);

    const plainProject = createProject({ name: `${shape} Plain` });
    const plainPlaced = setBlock(plainProject, makeBlock({ x: 0, y: 0, z: 0, shape, material: "plain" }));
    const plainVertices = verticesFromStl(exportAsciiStl(plainPlaced.project).stl);
    const tileVertices = verticesFromStl(exported.stl);
    const plainMaxZ = Math.max(...plainVertices.map((vertex) => vertex.z));
    const tileMaxZ = Math.max(...tileVertices.map((vertex) => vertex.z));
    assert.ok(tileMaxZ > plainMaxZ, `${shape} roof tiles should protrude above the slope`);
    assert.ok(!tileVertices.some((vertex) => vertex.z < 0), `${shape} roof tiles should not protrude below the base`);

    const exportedAgain = exportAsciiStl(placed.project);
    assert.equal(exported.stl, exportedAgain.stl, "roof tile pattern should stay fixed after placement");
  }
});

test("roof tile material does not add relief to regular cubes", () => {
  const project = createProject({ name: "Roof Tile Cube" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    material: "roof_tile",
    textureSeed: "roof-tile-cube"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.equal(exported.triangleCount, 12);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("roof corner supports roof tile relief on its sloped faces", () => {
  const project = createProject({ name: "Roof Corner Tile" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "roof_corner",
    material: "roof_tile",
    textureSeed: "roof-corner-tile"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);

  const plainProject = createProject({ name: "Plain Roof Corner" });
  const plainPlaced = setBlock(plainProject, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "roof_corner",
    material: "plain"
  }));
  const plainExported = exportAsciiStl(plainPlaced.project);
  assert.ok(exported.triangleCount > plainExported.triangleCount, "roof corner tile relief should add printable geometry");

  const tileVertices = verticesFromStl(exported.stl);
  assert.ok(
    tileVertices.some((vertex) => vertex.z > vertex.x + 0.2 && vertex.z > vertex.y + 0.2),
    "roof corner tile relief should lift off the original sloped faces"
  );
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

test("window cross above stair step overlaps slightly for slicer-safe support", () => {
  let project = createProject({ name: "Stair Window", workspaceCells: { x: 3, y: 3, z: 3 } });
  project = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "plain"
  })).project;
  project = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 1,
    shape: "window_cross",
    material: "plain"
  })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(
    vertices.some((vertex) => vertex.z < 50 && vertex.z > 49.5),
    "window bottom should slightly overlap the stair support instead of only touching at z=50"
  );
  assert.ok(
    vertices.some((vertex) => vertex.z < 25 && vertex.z > 24.5),
    "window should add support legs that reach the lower stair tread"
  );
  assert.ok(
    vertices.some((vertex) => vertex.x === 21 && vertex.z < 50),
    "window center bar should have a support leg down to the stair"
  );
});

test("door panel STL is a 100mm tall 10mm thick printable panel", () => {
  const project = createProject({ name: "Door Panel", workspaceCells: { x: 3, y: 3, z: 3 } });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "door_panel",
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
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 100);
  const triangles = trianglesFromStl(exported.stl);
  assert.equal(coversPointInXz(triangles, 14, 64), false, "upper door panes should be hollow");
  assert.equal(coversPointInXz(triangles, 25, 64), true, "upper door should keep the vertical window bar");
  assert.equal(coversPointInXz(triangles, 14, 75), true, "upper door should keep the horizontal window bar");
  assert.equal(coversPointInXz(triangles, 14, 25), true, "lower door panel should remain solid");
});

test("rotated door panel STL moves the 10mm panel to another side", () => {
  const project = createProject({ name: "Rotated Door", workspaceCells: { x: 3, y: 3, z: 3 } });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "door_panel",
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
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 100);
});

test("stair step STL is an L profile that occupies one cell", () => {
  const project = createProject({ name: "Stair Step" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "plain"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.x)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.x)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.y)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.z)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50);
  const triangles = trianglesFromStl(exported.stl);
  assert.equal(coversPointInXz(triangles, 12, 37), false, "upper-left quarter should be missing from the stair side profile");
  assert.equal(coversPointInXz(triangles, 12, 12), true, "lower tread volume should be solid");
  assert.equal(coversPointInXz(triangles, 37, 37), true, "upper tread volume should be solid");
});

test("frame cube STL is a hollow edge-only one-cell frame", () => {
  const project = createProject({ name: "Frame Cube" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "frame_cube",
    material: "plain"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.x)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.x)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.y)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.z)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50);
  assert.ok(vertices.some((vertex) => vertex.x === 5));
  assert.ok(vertices.some((vertex) => vertex.x === 45));
  assert.equal(coversPointInXz(trianglesFromStl(exported.stl), 25, 25), false, "frame cube center should stay hollow");
  assert.equal(coversPointInXz(trianglesFromStl(exported.stl), 2, 2), true, "frame cube edges should be solid");
});

test("frame cube above stair step overlaps slightly for slicer-safe support", () => {
  let project = createProject({ name: "Stair Frame Cube", workspaceCells: { x: 3, y: 3, z: 3 } });
  project = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "plain"
  })).project;
  project = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 1,
    shape: "frame_cube",
    material: "plain"
  })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(
    vertices.some((vertex) => vertex.z < 50 && vertex.z > 49.5),
    "frame cube bottom edges should slightly overlap the stair support instead of only touching at z=50"
  );
});

test("adjacent frame cubes overlap slightly for slicer-safe edge connections", () => {
  let project = createProject({ name: "Adjacent Frame Cubes", workspaceCells: { x: 3, y: 3, z: 2 } });
  project = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "frame_cube",
    material: "plain"
  })).project;
  project = setBlock(project, makeBlock({
    x: 1,
    y: 0,
    z: 0,
    shape: "frame_cube",
    material: "plain"
  })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(vertices.some((vertex) => vertex.x > 50 && vertex.x < 50.5), "first frame cube should overlap the neighbor by a tiny weld");
  assert.ok(vertices.some((vertex) => vertex.x < 50 && vertex.x > 49.5), "second frame cube should overlap the neighbor by a tiny weld");
});

test("brick stair step exports side relief on its L-profile sides", () => {
  const project = createProject({ name: "Brick Stair" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "brick",
    textureSeed: "brick-stair"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(Math.min(...vertices.map((vertex) => vertex.y)) < 0);
  assert.ok(Math.max(...vertices.map((vertex) => vertex.y)) > 50);
  assert.ok(exported.triangleCount > exportAsciiStl(setBlock(createProject(), makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "plain"
  })).project).triangleCount);
});

test("rubble stone stair step exports irregular side relief on its L-profile sides", () => {
  const project = createProject({ name: "Rubble Stair" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "rubble_stone",
    textureSeed: "rubble-stair"
  }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(Math.min(...vertices.map((vertex) => vertex.y)) < 0);
  assert.ok(Math.max(...vertices.map((vertex) => vertex.y)) > 50);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50, "rubble stair relief should not appear on top tread surfaces");

  const plainExported = exportAsciiStl(setBlock(createProject(), makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "plain"
  })).project);
  assert.ok(exported.triangleCount > plainExported.triangleCount);

  const brickExported = exportAsciiStl(setBlock(createProject(), makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "stair_step",
    material: "brick",
    textureSeed: "rubble-stair"
  })).project);
  assert.notEqual(exported.triangleCount, brickExported.triangleCount, "rubble stair should not reuse brick side boxes");
});

test("fence panel STL is a hollow 10mm thick panel without material relief", () => {
  const brickProject = createProject({ name: "Fence Brick" });
  const brickPlaced = setBlock(brickProject, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "fence_panel",
    material: "brick",
    textureSeed: "fence-brick"
  }));
  const plainProject = createProject({ name: "Fence Plain" });
  const plainPlaced = setBlock(plainProject, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "fence_panel",
    material: "plain"
  }));
  const brickExported = exportAsciiStl(brickPlaced.project);
  const plainExported = exportAsciiStl(plainPlaced.project);
  assert.equal(brickExported.ok, true);
  assert.equal(plainExported.ok, true);
  assert.equal(brickExported.triangleCount, plainExported.triangleCount, "fence should not add brick relief geometry");
  assert.deepEqual(nonManifoldEdges(brickExported.stl), []);

  const vertices = verticesFromStl(brickExported.stl);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.x)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.x)), 50);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.y)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 10);
  assert.equal(Math.min(...vertices.map((vertex) => vertex.z)), 0);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50);
  const triangles = trianglesFromStl(brickExported.stl);
  assert.equal(coversPointInXz(triangles, 14, 22), false, "fence gaps should be hollow");
  assert.equal(coversPointInXz(triangles, 25, 22), true, "middle fence post should be solid");
  assert.equal(coversPointInXz(triangles, 14, 10), true, "horizontal rail should be solid");
});

test("rotated fence panel STL moves the 10mm thickness to another side", () => {
  const project = createProject({ name: "Rotated Fence" });
  const placed = setBlock(project, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "fence_panel",
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
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 50);
});

test("adjacent fence panels weld slightly to avoid edge-only contact", () => {
  let project = createProject({ name: "Adjacent Fence", workspaceCells: { x: 4, y: 4, z: 2 } });
  project = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, shape: "fence_panel", material: "plain" })).project;
  project = setBlock(project, makeBlock({ x: 1, y: 0, z: 0, shape: "fence_panel", material: "plain" })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(vertices.some((vertex) => vertex.x > 50 && vertex.x < 50.1), "first fence should overlap the second by a tiny weld");
  assert.ok(vertices.some((vertex) => vertex.x < 50 && vertex.x > 49.9), "second fence should overlap the first by a tiny weld");
});

test("archway STL is a two-cell hollow panel", () => {
  const project = createProject({ name: "Archway", workspaceCells: { x: 3, y: 3, z: 3 } });
  const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, shape: "archway", material: "plain" }));
  const exported = exportAsciiStl(placed.project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.z)), 100);
  assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 10);
  const triangles = trianglesFromStl(exported.stl);
  assert.equal(coversPointInXz(triangles, 25, 30), false, "archway opening should stay hollow");
  assert.equal(coversPointInXz(triangles, 25, 88), false, "archway should keep a rounded opening under the arch");
  assert.equal(coversPointInXz(triangles, 25, 94), true, "archway should have a solid polygon arch above the opening");
  assert.equal(coversPointInXz(triangles, 5, 88), true, "archway upper corners should be filled for stacking");
  assert.equal(coversPointInXz(triangles, 4, 30), true, "archway side post should be solid");
});

test("new scene object STLs are closed and fit their cells", () => {
  for (const shape of ["roof_corner", "chimney", "road", "river"]) {
    const project = createProject({ name: shape });
    const placed = setBlock(project, makeBlock({ x: 0, y: 0, z: 0, shape, material: "plain" }));
    const exported = exportAsciiStl(placed.project);
    assert.equal(exported.ok, true, `${shape} should export`);
    assert.deepEqual(nonManifoldEdges(exported.stl), [], `${shape} should be manifold`);
    const vertices = verticesFromStl(exported.stl);
    assert.equal(Math.min(...vertices.map((vertex) => vertex.x)), 0, `${shape} min x`);
    assert.equal(Math.max(...vertices.map((vertex) => vertex.x)), 50, `${shape} max x`);
    assert.equal(Math.min(...vertices.map((vertex) => vertex.y)), 0, `${shape} min y`);
    assert.equal(Math.max(...vertices.map((vertex) => vertex.y)), 50, `${shape} max y`);
    assert.equal(Math.min(...vertices.map((vertex) => vertex.z)), 0, `${shape} min z`);
    assert.ok(Math.max(...vertices.map((vertex) => vertex.z)) <= 50, `${shape} should fit one cell high`);
  }
});

test("chimney supports cube wall materials on its exterior faces", () => {
  const plainProject = createProject({ name: "Plain Chimney" });
  const plainPlaced = setBlock(plainProject, makeBlock({
    x: 0,
    y: 0,
    z: 0,
    shape: "chimney",
    material: "plain"
  }));
  const plainExported = exportAsciiStl(plainPlaced.project);
  assert.equal(plainExported.ok, true);

  for (const material of ["brick", "rubble_stone", "metal_plate", "grid_tile"]) {
    const project = createProject({ name: `${material} Chimney` });
    const placed = setBlock(project, makeBlock({
      x: 0,
      y: 0,
      z: 0,
      shape: "chimney",
      material,
      textureSeed: `${material}-chimney`
    }));
    const exported = exportAsciiStl(placed.project);
    assert.equal(exported.ok, true);
    assert.deepEqual(nonManifoldEdges(exported.stl), [], `${material} chimney should be manifold`);
    assert.ok(exported.triangleCount > plainExported.triangleCount, `${material} chimney should include exterior relief`);
  }
});

test("roof corner on top of a cube does not leave overlapping support faces", () => {
  let project = createProject({ name: "Supported Roof Corner", workspaceCells: { x: 3, y: 3, z: 3 } });
  project = setBlock(project, makeBlock({
    x: 1,
    y: 1,
    z: 0,
    material: "brick",
    textureSeed: "roof-corner-support"
  })).project;
  project = setBlock(project, makeBlock({
    x: 1,
    y: 1,
    z: 1,
    shape: "roof_corner",
    material: "plain"
  })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
});

test("roof corner beside a cube uses a tiny weld instead of exact edge contact", () => {
  let project = createProject({ name: "Side Roof Corner", workspaceCells: { x: 3, y: 3, z: 3 } });
  project = setBlock(project, makeBlock({
    x: 1,
    y: 1,
    z: 1,
    shape: "roof_corner",
    material: "plain"
  })).project;
  project = setBlock(project, makeBlock({
    x: 0,
    y: 1,
    z: 1,
    material: "brick",
    textureSeed: "roof-corner-side"
  })).project;
  const exported = exportAsciiStl(project);
  assert.equal(exported.ok, true);
  assert.deepEqual(nonManifoldEdges(exported.stl), []);
  const vertices = verticesFromStl(exported.stl);
  assert.ok(vertices.some((vertex) => vertex.x < 50 && vertex.x > 49.9), "roof corner should slightly overlap side support");
});

test("available materials export printable geometry", () => {
  for (const material of ["brick", "rubble_stone", "roof_tile", "metal_plate", "grid_tile", "plain"]) {
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

function trianglesFromStl(stl) {
  const vertices = verticesFromStl(stl);
  const triangles = [];
  for (let index = 0; index < vertices.length; index += 3) {
    triangles.push([vertices[index], vertices[index + 1], vertices[index + 2]]);
  }
  return triangles;
}

function coversPointInXz(triangles, x, z) {
  return triangles.some((triangle) => pointInTriangleXz(triangle, x, z));
}

function pointInTriangleXz([a, b, c], x, z) {
  const denominator = ((b.z - c.z) * (a.x - c.x)) + ((c.x - b.x) * (a.z - c.z));
  if (Math.abs(denominator) < 1e-8) return false;
  const alpha = (((b.z - c.z) * (x - c.x)) + ((c.x - b.x) * (z - c.z))) / denominator;
  const beta = (((c.z - a.z) * (x - c.x)) + ((a.x - c.x) * (z - c.z))) / denominator;
  const gamma = 1 - alpha - beta;
  return alpha >= -1e-8 && beta >= -1e-8 && gamma >= -1e-8;
}
