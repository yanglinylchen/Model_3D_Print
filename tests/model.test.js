import assert from "node:assert/strict";
import test from "node:test";
import { MAX_BLOCKS } from "../src/core/constants.js";
import { ProjectHistory } from "../src/core/history.js";
import {
  createProject,
  getBlock,
  getThirtyDegreeHeightMm,
  makeBlock,
  normalizeProject,
  pasteBlock,
  removeBlock,
  resizeWorkspace,
  setBlock
} from "../src/core/model.js";

test("normalizes project save/open round trip", () => {
  const project = createProject({ name: "Round Trip" });
  const placed = setBlock(project, makeBlock({ x: 1, y: 2, z: 3, material: "plain", textureSeed: "fixed" }));
  assert.equal(placed.ok, true);

  const parsed = normalizeProject(JSON.parse(JSON.stringify(placed.project)));
  assert.equal(parsed.name, "Round Trip");
  assert.equal(parsed.blocks[0].textureSeed, "fixed");
});

test("workspace resize blocks when existing blocks would exceed new bounds", () => {
  const project = createProject();
  const placed = setBlock(project, makeBlock({ x: 4, y: 0, z: 0 }));
  assert.equal(placed.ok, true);

  const resized = resizeWorkspace(placed.project, { x: 4, y: 20, z: 20 });
  assert.equal(resized.ok, false);
  assert.match(resized.reason, /超出邊界/);
});

test("placed block count limit is enforced", () => {
  const project = createProject({ workspaceCells: { x: 200, y: 200, z: 1 } });
  project.blocks = Array.from({ length: MAX_BLOCKS }, (_, index) =>
    makeBlock({ x: index % 200, y: Math.floor(index / 200), z: 0, textureSeed: `seed-${index}` })
  );

  const result = setBlock(project, makeBlock({ x: 150, y: 199, z: 0, textureSeed: "overflow" }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /上限/);
});

test("30-degree triangular prism height is 28.87mm in a 50mm cell", () => {
  assert.equal(Number(getThirtyDegreeHeightMm().toFixed(2)), 28.87);
});

test("roof support rule blocks direct placement above 30 and 45 degree prisms", () => {
  for (const shape of ["prism_30", "prism_45"]) {
    let project = createProject();
    project = setBlock(project, makeBlock({ x: 1, y: 1, z: 0, shape })).project;

    const unsupported = setBlock(project, makeBlock({ x: 1, y: 1, z: 1 }));
    assert.equal(unsupported.ok, false);
    assert.match(unsupported.reason, /斜面方塊/);

    project = setBlock(project, makeBlock({ x: 2, y: 1, z: 1 })).project;
    const supported = setBlock(project, makeBlock({ x: 1, y: 1, z: 1 }));
    assert.equal(supported.ok, true);
  }
});

test("deleting a support block is blocked when it would leave a roof block unsupported", () => {
  let project = createProject();
  project = setBlock(project, makeBlock({ x: 1, y: 1, z: 0, shape: "prism_30" })).project;
  project = setBlock(project, makeBlock({ x: 2, y: 1, z: 1, textureSeed: "support" })).project;
  project = setBlock(project, makeBlock({ x: 1, y: 1, z: 1, textureSeed: "upper" })).project;

  const removed = removeBlock(project, { x: 2, y: 1, z: 1 });
  assert.equal(removed.ok, false);
  assert.match(removed.reason, /失去支撐/);
});

test("copy paste preserves texture seed", () => {
  const project = createProject();
  const copied = makeBlock({ x: 0, y: 0, z: 0, material: "plain", textureSeed: "exact-plain" });
  const result = pasteBlock(project, copied, { x: 3, y: 2, z: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.block.textureSeed, "exact-plain");
});

test("window cross shape occupies one regular grid cell", () => {
  const project = createProject();
  const placed = setBlock(project, makeBlock({ x: 2, y: 3, z: 1, shape: "window_cross", material: "plain" }));
  assert.equal(placed.ok, true);
  assert.equal(placed.block.shape, "window_cross");
  assert.equal(placed.project.blocks.length, 1);
});

test("door panel occupies two vertical grid cells", () => {
  let project = createProject({ workspaceCells: { x: 4, y: 4, z: 4 } });
  const placed = setBlock(project, makeBlock({ x: 1, y: 1, z: 1, shape: "door_panel", material: "plain" }));
  assert.equal(placed.ok, true);
  project = placed.project;
  assert.equal(getBlock(project, { x: 1, y: 1, z: 1 }).shape, "door_panel");
  assert.equal(getBlock(project, { x: 1, y: 1, z: 2 }).shape, "door_panel");

  const overlap = setBlock(project, makeBlock({ x: 1, y: 1, z: 2, material: "plain" }));
  assert.equal(overlap.ok, false);
  assert.match(overlap.reason, /占用/);

  const outOfBounds = setBlock(project, makeBlock({ x: 2, y: 1, z: 3, shape: "door_panel", material: "plain" }));
  assert.equal(outOfBounds.ok, false);
  assert.match(outOfBounds.reason, /超出工作空間/);

  const resized = resizeWorkspace(project, { x: 4, y: 4, z: 2 });
  assert.equal(resized.ok, false);
  assert.match(resized.reason, /超出邊界/);
});

test("door panel does not support itself above a restricted prism", () => {
  let project = createProject({ workspaceCells: { x: 4, y: 4, z: 4 } });
  project = setBlock(project, makeBlock({ x: 1, y: 1, z: 0, shape: "prism_45", material: "plain" })).project;
  const unsupportedDoor = setBlock(project, makeBlock({ x: 1, y: 1, z: 1, shape: "door_panel", material: "plain" }));
  assert.equal(unsupportedDoor.ok, false);
  assert.match(unsupportedDoor.reason, /斜面方塊/);
});

test("stair step allows direct placement above because it has flat tread surfaces", () => {
  let project = createProject({ workspaceCells: { x: 4, y: 4, z: 4 } });
  project = setBlock(project, makeBlock({ x: 1, y: 1, z: 0, shape: "stair_step", material: "brick" })).project;
  const upper = setBlock(project, makeBlock({ x: 1, y: 1, z: 1, material: "plain" }));
  assert.equal(upper.ok, true);
});

test("fence panel occupies one regular grid cell", () => {
  const project = createProject();
  const placed = setBlock(project, makeBlock({ x: 2, y: 2, z: 0, shape: "fence_panel", material: "brick" }));
  assert.equal(placed.ok, true);
  assert.equal(placed.block.shape, "fence_panel");
  assert.equal(placed.project.blocks.length, 1);
});

test("new scene objects occupy their expected grid cells", () => {
  let project = createProject({ workspaceCells: { x: 5, y: 5, z: 5 } });
  for (const shape of ["roof_corner", "chimney", "road", "river"]) {
    const placed = setBlock(project, makeBlock({ x: project.blocks.length, y: 0, z: 0, shape, material: "plain" }));
    assert.equal(placed.ok, true, `${shape} should be placeable`);
    project = placed.project;
  }

  const arch = setBlock(project, makeBlock({ x: 0, y: 1, z: 1, shape: "archway", material: "plain" }));
  assert.equal(arch.ok, true);
  assert.equal(getBlock(arch.project, { x: 0, y: 1, z: 1 }).shape, "archway");
  assert.equal(getBlock(arch.project, { x: 0, y: 1, z: 2 }).shape, "archway");
});

test("undo history retains only 50 steps", () => {
  let project = createProject({ workspaceCells: { x: 100, y: 1, z: 1 } });
  const history = new ProjectHistory(project);
  for (let index = 0; index < 60; index += 1) {
    project = setBlock(project, makeBlock({ x: index, y: 0, z: 0, textureSeed: `seed-${index}` })).project;
    history.commit(project);
  }
  assert.equal(history.undoStack.length, 50);
});
