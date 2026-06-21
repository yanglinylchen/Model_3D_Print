import assert from "node:assert/strict";
import test from "node:test";
import { MAX_BLOCKS } from "../src/core/constants.js";
import { ProjectHistory } from "../src/core/history.js";
import {
  createProject,
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
  const placed = setBlock(project, makeBlock({ x: 1, y: 2, z: 3, material: "wood", textureSeed: "fixed" }));
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
  const copied = makeBlock({ x: 0, y: 0, z: 0, material: "wool", textureSeed: "exact-wool" });
  const result = pasteBlock(project, copied, { x: 3, y: 2, z: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.block.textureSeed, "exact-wool");
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
