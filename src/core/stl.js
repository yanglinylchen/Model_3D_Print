import { CELL_SIZE_MM } from "./constants.js";

const PRISM_WELD_OVERLAP_MM = 0.08;
const BRICK_RELIEF_RAISE_MM = 1;
const BRICK_RELIEF_EMBED_MM = 0.08;
const BRICK_MORTAR_GAP_MM = 1.2;
const BRICK_ROWS = 5;
const RUBBLE_STONE_RAISE_MM = 1.2;
const RUBBLE_STONE_EMBED_MM = 0.08;
const RUBBLE_STONE_JOINT_GAP_MM = 1.5;
const ROOF_TILE_RAISE_MM = 1.1;
const ROOF_TILE_EMBED_MM = 0.08;
const ROOF_TILE_GAP_MM = 1.3;
const WINDOW_THICKNESS_MM = 10;
const WINDOW_BAR_MM = 8;
const FENCE_THICKNESS_MM = 10;
const DOOR_THICKNESS_MM = 10;
const DOOR_BACK_RECESS_MM = 2;
const DOOR_RAIL_MM = 7;
const DOOR_MID_RAIL_MM = 8;

export function exportAsciiStl(project, name = project.name || "model_3d_print") {
  const triangles = [];
  for (const block of project.blocks) {
    triangles.push(...trianglesForBlock(block, project));
    triangles.push(...reliefTrianglesForBlock(project, block));
  }
  const repaired = repairTriangles(triangles);
  const validation = validateTriangles(repaired);
  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
      stl: "",
      triangleCount: repaired.length
    };
  }
  return {
    ok: true,
    stl: stringifyAsciiStl(name, repaired),
    triangleCount: repaired.length,
    repairNotes: [
      "已合併可安全處理的幾何資料",
      "已使用列印安全模式輸出閉合外殼",
      "已將牆面浮雕限制在外露側面，瓦片浮雕限制在三角柱斜面"
    ]
  };
}

export function reliefTrianglesForBlock(project, block) {
  if (!project || !["brick", "rubble_stone", "roof_tile"].includes(block.material)) return [];
  const x = block.x * CELL_SIZE_MM;
  const y = block.y * CELL_SIZE_MM;
  const z = block.z * CELL_SIZE_MM;
  if (block.material === "roof_tile") {
    if (block.shape === "prism_30") {
      return roofTileReliefTriangles(x, y, z, Math.tan(Math.PI / 6) * CELL_SIZE_MM, block);
    }
    if (block.shape === "prism_45") {
      return roofTileReliefTriangles(x, y, z, CELL_SIZE_MM, block);
    }
    return [];
  }
  if (block.shape === "stair_step") {
    return block.material === "brick" ? stairReliefTriangles(project, block, x, y, z) : [];
  }
  if (block.shape !== "cube") return [];
  const triangles = [];
  for (const face of ["south", "east", "north", "west"]) {
    if (neighborAt(project, block, face)) continue;
    if (block.material === "rubble_stone") {
      triangles.push(...rubbleStoneSideReliefTriangles(x, y, z, CELL_SIZE_MM, face, block.textureSeed || ""));
    } else {
      for (const [min, max] of brickSideReliefBoxes(x, y, z, CELL_SIZE_MM, face, block.textureSeed || "")) {
        triangles.push(...cuboidTriangles(min, max));
      }
    }
  }
  return triangles;
}

export function trianglesForBlock(block, project = null) {
  const x = block.x * CELL_SIZE_MM;
  const y = block.y * CELL_SIZE_MM;
  const z = block.z * CELL_SIZE_MM;
  if (block.shape === "prism_30") {
    return triangularPrismTriangles(x, y, z, Math.tan(Math.PI / 6) * CELL_SIZE_MM, block, project);
  }
  if (block.shape === "prism_45") {
    return triangularPrismTriangles(x, y, z, CELL_SIZE_MM, block, project);
  }
  if (block.shape === "stair_step") {
    return rotateTrianglesZ(stairStepTriangles(x, y, z), [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], block.rotation || 0);
  }
  if (block.shape === "window_cross") {
    return rotateTrianglesZ(windowCrossTriangles(x, y, z), [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], block.rotation || 0);
  }
  if (block.shape === "fence_panel") {
    return rotateTrianglesZ(fencePanelTriangles(x, y, z, block, project), [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], block.rotation || 0);
  }
  if (block.shape === "door_panel") {
    return rotateTrianglesZ(doorPanelTriangles(x, y, z), [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], block.rotation || 0);
  }
  return cubeTriangles(x, y, z, CELL_SIZE_MM, block, project);
}

export function validateTriangles(triangles) {
  if (!triangles.length) {
    return { ok: false, reason: "模型沒有可輸出的三角面。" };
  }
  for (const triangle of triangles) {
    if (triangleArea(triangle) <= 1e-8) {
      return { ok: false, reason: "偵測到退化三角面。" };
    }
  }
  return { ok: true };
}

export function repairTriangles(triangles) {
  const seen = new Set();
  const repaired = [];
  for (const triangle of triangles) {
    if (triangleArea(triangle) <= 1e-8) continue;
    const key = triangle
      .map((point) => point.map((value) => value.toFixed(5)).join(","))
      .sort()
      .join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    repaired.push(triangle);
  }
  return repaired;
}

function cubeTriangles(x, y, z, size, block, project) {
  if (!project) return cuboidTriangles([x, y, z], [x + size, y + size, z + size]);
  const vertices = cubeVertices([x, y, z], [x + size, y + size, z + size]);
  const faces = [];
  if (shouldEmitCubeFace(project, block, "bottom")) faces.push([vertices.p000, vertices.p100, vertices.p110, vertices.p010]);
  if (shouldEmitCubeFace(project, block, "top")) faces.push([vertices.p001, vertices.p011, vertices.p111, vertices.p101]);
  if (shouldEmitCubeFace(project, block, "south")) faces.push([vertices.p000, vertices.p001, vertices.p101, vertices.p100]);
  if (shouldEmitCubeFace(project, block, "east")) faces.push([vertices.p100, vertices.p101, vertices.p111, vertices.p110]);
  if (shouldEmitCubeFace(project, block, "north")) faces.push([vertices.p110, vertices.p111, vertices.p011, vertices.p010]);
  if (shouldEmitCubeFace(project, block, "west")) faces.push([vertices.p010, vertices.p011, vertices.p001, vertices.p000]);
  return facesToTriangles(faces);
}

function cuboidTriangles(min, max) {
  const vertices = cubeVertices(min, max);
  return facesToTriangles([
    [vertices.p000, vertices.p100, vertices.p110, vertices.p010],
    [vertices.p001, vertices.p011, vertices.p111, vertices.p101],
    [vertices.p000, vertices.p001, vertices.p101, vertices.p100],
    [vertices.p100, vertices.p101, vertices.p111, vertices.p110],
    [vertices.p110, vertices.p111, vertices.p011, vertices.p010],
    [vertices.p010, vertices.p011, vertices.p001, vertices.p000]
  ]);
}

function brickSideReliefBoxes(x, y, z, size, face, seed) {
  const boxes = [];
  const rowHeight = size / BRICK_ROWS;
  const inset = BRICK_MORTAR_GAP_MM;
  const phase = seededUnit(`${seed}:${face}`) > 0.5 ? 1 : 0;
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    const v0 = row * rowHeight + inset / 2;
    const v1 = (row + 1) * rowHeight - inset / 2;
    const staggered = (row + phase) % 2 === 1;
    const brickWidth = staggered ? size / 2 : size / 3;
    const start = staggered ? -brickWidth / 2 : 0;
    for (let u = start; u < size; u += brickWidth) {
      const u0 = Math.max(0, u) + inset / 2;
      const u1 = Math.min(size, u + brickWidth) - inset / 2;
      if (u1 - u0 < 3 || v1 - v0 < 3) continue;
      boxes.push(reliefBoxForFace(x, y, z, face, u0, u1, v0, v1));
    }
  }
  return boxes;
}

function reliefBoxForFace(x, y, z, face, u0, u1, v0, v1) {
  const raise = BRICK_RELIEF_RAISE_MM;
  const embed = BRICK_RELIEF_EMBED_MM;
  return reliefBoxForFaceWithDepth(x, y, z, face, u0, u1, v0, v1, raise, embed);
}

function rubbleStoneSideReliefTriangles(x, y, z, size, face, seed) {
  const triangles = [];
  const gap = RUBBLE_STONE_JOINT_GAP_MM;
  const rows = irregularBreaks(size, `${seed}:rubble:${face}:row`, 9, 16);
  for (let row = 0; row < rows.length - 1; row += 1) {
    const rowTop = rows[row];
    const rowBottom = rows[row + 1];
    const rowSeed = `${seed}:rubble:${face}:row:${row}`;
    const shifted = seededUnit(`${rowSeed}:shift`) > 0.52;
    const stones = irregularBreaks(size, `${rowSeed}:stone`, 11, 23);
    const startOffset = shifted ? -((stones[1] - stones[0]) * 0.45) : 0;
    for (let index = 0; index < stones.length - 1; index += 1) {
      const raw0 = stones[index] + startOffset;
      const raw1 = stones[index + 1] + startOffset;
      const u0 = Math.max(0, raw0) + gap / 2;
      const u1 = Math.min(size, raw1) - gap / 2;
      const v0 = rowTop + gap / 2;
      const v1 = rowBottom - gap / 2;
      if (u1 - u0 < 5 || v1 - v0 < 5) continue;
      const relief = 0.75 + seededUnit(`${rowSeed}:relief:${index}`) * 0.75;
      triangles.push(...reliefPolygonForFace(
        x,
        y,
        z,
        face,
        irregularStonePolygon(u0, u1, v0, v1, `${rowSeed}:shape:${index}`),
        relief,
        RUBBLE_STONE_EMBED_MM
      ));
    }
  }
  return triangles;
}

function irregularBreaks(size, seed, minStep, maxStep) {
  const breaks = [0];
  let cursor = 0;
  let index = 0;
  while (cursor < size - minStep) {
    const step = minStep + seededUnit(`${seed}:${index}`) * (maxStep - minStep);
    cursor = Math.min(size, cursor + step);
    if (size - cursor < minStep * 0.72) {
      cursor = size;
    }
    breaks.push(Number(cursor.toFixed(3)));
    index += 1;
  }
  if (breaks.at(-1) !== size) breaks.push(size);
  return breaks;
}

function reliefBoxForFaceWithDepth(x, y, z, face, u0, u1, v0, v1, raise, embed) {
  if (face === "east") {
    return [[x + CELL_SIZE_MM - embed, y + u0, z + v0], [x + CELL_SIZE_MM + raise, y + u1, z + v1]];
  }
  if (face === "west") {
    return [[x - raise, y + u0, z + v0], [x + embed, y + u1, z + v1]];
  }
  if (face === "north") {
    return [[x + u0, y + CELL_SIZE_MM - embed, z + v0], [x + u1, y + CELL_SIZE_MM + raise, z + v1]];
  }
  return [[x + u0, y - raise, z + v0], [x + u1, y + embed, z + v1]];
}

function irregularStonePolygon(u0, u1, v0, v1, seed) {
  const width = u1 - u0;
  const height = v1 - v0;
  const jitterU = Math.min(width * 0.16, 2.3);
  const jitterV = Math.min(height * 0.16, 2.0);
  const j = (name, amount) => (seededUnit(`${seed}:${name}`) - 0.5) * amount;
  const midU = (u0 + u1) / 2 + j("mid-u", jitterU);
  const midV = (v0 + v1) / 2 + j("mid-v", jitterV);
  return [
    [u0 + jitterU * 0.4 + Math.abs(j("a-u", jitterU)), v0 + jitterV * 0.4 + Math.abs(j("a-v", jitterV))],
    [midU, v0 + Math.abs(j("b-v", jitterV))],
    [u1 - jitterU * 0.4 - Math.abs(j("c-u", jitterU)), v0 + jitterV * 0.4 + Math.abs(j("c-v", jitterV))],
    [u1 - Math.abs(j("d-u", jitterU)), midV],
    [u1 - jitterU * 0.4 - Math.abs(j("e-u", jitterU)), v1 - jitterV * 0.4 - Math.abs(j("e-v", jitterV))],
    [midU + j("f-u", jitterU), v1 - Math.abs(j("f-v", jitterV))],
    [u0 + jitterU * 0.4 + Math.abs(j("g-u", jitterU)), v1 - jitterV * 0.4 - Math.abs(j("g-v", jitterV))],
    [u0 + Math.abs(j("h-u", jitterU)), midV + j("h-v", jitterV)]
  ];
}

function reliefPolygonForFace(x, y, z, face, points, raise, embed) {
  const bottom = points.map(([u, v]) => pointForFace(x, y, z, face, u, v, -embed));
  const top = points.map(([u, v]) => pointForFace(x, y, z, face, u, v, raise));
  const triangles = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    triangles.push([bottom[0], bottom[index + 1], bottom[index]]);
    triangles.push([top[0], top[index], top[index + 1]]);
  }
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    triangles.push(...facesToTriangles([[bottom[index], bottom[next], top[next], top[index]]]));
  }
  return triangles;
}

function pointForFace(x, y, z, face, u, v, offset) {
  if (face === "east") return [x + CELL_SIZE_MM + offset, y + u, z + v];
  if (face === "west") return [x - offset, y + u, z + v];
  if (face === "north") return [x + u, y + CELL_SIZE_MM + offset, z + v];
  return [x + u, y - offset, z + v];
}

function roofTileReliefTriangles(x, y, z, height, block) {
  const triangles = [];
  const seed = block.textureSeed || "roof-tile";
  const rowBreaks = [3, 11, 19, 27, 35, 43, 50];
  const gap = ROOF_TILE_GAP_MM;
  for (let row = 0; row < rowBreaks.length - 1; row += 1) {
    const u0 = rowBreaks[row] + gap / 2;
    const u1 = rowBreaks[row + 1] - gap / 2;
    const phase = (row % 2 === 0) ? -8 : 0;
    for (let v = phase; v < CELL_SIZE_MM; v += 17) {
      const v0 = Math.max(0, v) + gap / 2;
      const v1 = Math.min(CELL_SIZE_MM, v + 17) - gap / 2;
      if (u1 - u0 < 4 || v1 - v0 < 5) continue;
      const jitter = seededUnit(`${seed}:tile:${row}:${v}`) * 0.9;
      triangles.push(...slopePlateTriangles(
        x,
        y,
        z,
        height,
        u0 + jitter,
        Math.min(u1, u1 + jitter),
        v0,
        v1
      ));
    }
  }
  return rotateTrianglesZ(triangles, [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], block.rotation || 0);
}

function slopePlateTriangles(x, y, z, height, u0, u1, v0, v1) {
  const normal = normalizeVector([-height, 0, CELL_SIZE_MM]);
  const top = (u, v) => offsetPoint(pointOnSlope(x, y, z, height, u, v), normal, ROOF_TILE_RAISE_MM);
  const bottom = (u, v) => offsetPoint(pointOnSlope(x, y, z, height, u, v), normal, -ROOF_TILE_EMBED_MM);
  const a = bottom(u0, v0);
  const b = bottom(u1, v0);
  const c = bottom(u1, v1);
  const d = bottom(u0, v1);
  const A = top(u0, v0);
  const B = top(u1, v0);
  const C = top(u1, v1);
  const D = top(u0, v1);
  return facesToTriangles([
    [a, b, c, d],
    [A, D, C, B],
    [a, A, B, b],
    [b, B, C, c],
    [c, C, D, d],
    [d, D, A, a]
  ]);
}

function pointOnSlope(x, y, z, height, u, v) {
  return [x + u, y + v, z + (height * u) / CELL_SIZE_MM];
}

function offsetPoint(point, vector, distance) {
  return [
    point[0] + vector[0] * distance,
    point[1] + vector[1] * distance,
    point[2] + vector[2] * distance
  ];
}

function normalizeVector(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function stairReliefTriangles(project, block, x, y, z) {
  const triangles = [];
  const rotation = block.rotation || 0;
  for (const localFace of ["south", "north"]) {
    if (neighborAt(project, block, rotatedFace(localFace, rotation))) continue;
    for (const [min, max] of stairSideReliefBoxes(x, y, z, localFace, block.textureSeed || "")) {
      triangles.push(...cuboidTriangles(min, max));
    }
  }
  return rotateTrianglesZ(triangles, [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], rotation);
}

function stairSideReliefBoxes(x, y, z, face, seed) {
  const boxes = [];
  const rows = [
    [0, CELL_SIZE_MM / 4, 0],
    [CELL_SIZE_MM / 4, CELL_SIZE_MM / 2, 0],
    [CELL_SIZE_MM / 2, (CELL_SIZE_MM * 3) / 4, CELL_SIZE_MM / 2],
    [(CELL_SIZE_MM * 3) / 4, CELL_SIZE_MM, CELL_SIZE_MM / 2]
  ];
  const phase = seededUnit(`${seed}:stair:${face}`) > 0.5 ? 1 : 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const [z0, z1, xStart] = rows[rowIndex];
    const brickWidth = ((rowIndex + phase) % 2 === 0) ? CELL_SIZE_MM / 4 : CELL_SIZE_MM / 3;
    for (let u = xStart; u < CELL_SIZE_MM; u += brickWidth) {
      const u0 = Math.max(xStart, u) + BRICK_MORTAR_GAP_MM / 2;
      const u1 = Math.min(CELL_SIZE_MM, u + brickWidth) - BRICK_MORTAR_GAP_MM / 2;
      const v0 = z0 + BRICK_MORTAR_GAP_MM / 2;
      const v1 = z1 - BRICK_MORTAR_GAP_MM / 2;
      if (u1 - u0 < 3 || v1 - v0 < 3) continue;
      boxes.push(reliefBoxForFace(x, y, z, face, u0, u1, v0, v1));
    }
  }
  return boxes;
}

function rotatedFace(face, degrees) {
  const order = ["east", "north", "west", "south"];
  const vectors = {
    east: [1, 0],
    north: [0, 1],
    west: [-1, 0],
    south: [0, -1]
  };
  const normalized = ((degrees % 360) + 360) % 360;
  const steps = Math.round(normalized / 90) % 4;
  const [x, y] = vectors[face];
  const rotated = [
    [x, y],
    [-y, x],
    [-x, -y],
    [y, -x]
  ][steps];
  return order.find((candidate) => {
    const vector = vectors[candidate];
    return vector[0] === rotated[0] && vector[1] === rotated[1];
  });
}

function stairStepTriangles(x, y, z) {
  const s = CELL_SIZE_MM;
  const h = s / 2;
  const y0 = y;
  const y1 = y + s;
  const a = [x, y0, z];
  const b = [x + h, y0, z];
  const c = [x + s, y0, z];
  const d = [x + s, y0, z + h];
  const e = [x + s, y0, z + s];
  const f = [x + h, y0, z + s];
  const g = [x + h, y0, z + h];
  const i = [x, y0, z + h];
  const A = [x, y1, z];
  const B = [x + h, y1, z];
  const C = [x + s, y1, z];
  const D = [x + s, y1, z + h];
  const E = [x + s, y1, z + s];
  const F = [x + h, y1, z + s];
  const G = [x + h, y1, z + h];
  const I = [x, y1, z + h];
  return facesToTriangles([
    [a, b, g, i],
    [b, c, d, g],
    [g, d, e, f],
    [A, I, G, B],
    [B, G, D, C],
    [G, F, E, D],
    [a, A, B, b],
    [b, B, C, c],
    [c, C, D, d],
    [d, D, E, e],
    [e, E, F, f],
    [f, F, G, g],
    [g, G, I, i],
    [i, I, A, a]
  ]);
}

function windowCrossTriangles(x, y, z) {
  const s = CELL_SIZE_MM;
  const b = WINDOW_BAR_MM;
  const center0 = s / 2 - b / 2;
  const center1 = s / 2 + b / 2;
  const spans = [0, b, center0, center1, s - b, s];
  const occupied = [];
  for (let xi = 0; xi < spans.length - 1; xi += 1) {
    occupied[xi] = [];
    for (let zi = 0; zi < spans.length - 1; zi += 1) {
      const x0 = spans[xi];
      const x1 = spans[xi + 1];
      const z0 = spans[zi];
      const z1 = spans[zi + 1];
      occupied[xi][zi] = x0 < b || x1 > s - b || z0 < b || z1 > s - b || (x0 < center1 && x1 > center0) || (z0 < center1 && z1 > center0);
    }
  }

  const triangles = [];
  const y0 = y;
  const y1 = y + WINDOW_THICKNESS_MM;
  for (let xi = 0; xi < spans.length - 1; xi += 1) {
    for (let zi = 0; zi < spans.length - 1; zi += 1) {
      if (!occupied[xi][zi]) continue;
      const x0 = x + spans[xi];
      const x1 = x + spans[xi + 1];
      const z0 = z + spans[zi];
      const z1 = z + spans[zi + 1];
      const vertices = {
        p000: [x0, y0, z0],
        p100: [x1, y0, z0],
        p110: [x1, y1, z0],
        p010: [x0, y1, z0],
        p001: [x0, y0, z1],
        p101: [x1, y0, z1],
        p111: [x1, y1, z1],
        p011: [x0, y1, z1]
      };
      const faces = [
        [vertices.p000, vertices.p001, vertices.p101, vertices.p100],
        [vertices.p010, vertices.p110, vertices.p111, vertices.p011]
      ];
      if (!occupied[xi - 1]?.[zi]) faces.push([vertices.p000, vertices.p010, vertices.p011, vertices.p001]);
      if (!occupied[xi + 1]?.[zi]) faces.push([vertices.p100, vertices.p101, vertices.p111, vertices.p110]);
      if (!occupied[xi]?.[zi - 1]) faces.push([vertices.p000, vertices.p100, vertices.p110, vertices.p010]);
      if (!occupied[xi]?.[zi + 1]) faces.push([vertices.p001, vertices.p011, vertices.p111, vertices.p101]);
      triangles.push(...facesToTriangles(faces));
    }
  }
  return triangles;
}

function fencePanelTriangles(x, y, z, block, project) {
  const rotation = block?.rotation || 0;
  const weldWest = adjacentFence(project, block, rotatedFace("west", rotation)) ? PRISM_WELD_OVERLAP_MM : 0;
  const weldEast = adjacentFence(project, block, rotatedFace("east", rotation)) ? PRISM_WELD_OVERLAP_MM : 0;
  const xSpans = [-weldWest, 7, 18, 22, 28, 32, 43, 50 + weldEast];
  const zSpans = [0, 8, 15, 28, 35, 50];
  const occupied = [];
  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    occupied[xi] = [];
    for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
      const x0 = xSpans[xi];
      const x1 = xSpans[xi + 1];
      const z0 = zSpans[zi];
      const z1 = zSpans[zi + 1];
      occupied[xi][zi] = x0 < 7 || (x0 >= 22 && x1 <= 28) || x1 > 43 || (z0 >= 8 && z1 <= 15) || (z0 >= 28 && z1 <= 35);
    }
  }
  return gridPanelTriangles(x, y, z, xSpans, zSpans, occupied, FENCE_THICKNESS_MM);
}

function adjacentFence(project, block, face) {
  const neighbor = project && block ? neighborAt(project, block, face) : null;
  return neighbor?.shape === "fence_panel" && (neighbor.rotation || 0) === (block.rotation || 0);
}

function gridPanelTriangles(x, y, z, xSpans, zSpans, occupied, thickness) {
  const triangles = [];
  const y0 = y;
  const y1 = y + thickness;
  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
      if (!occupied[xi][zi]) continue;
      const x0 = x + xSpans[xi];
      const x1 = x + xSpans[xi + 1];
      const z0 = z + zSpans[zi];
      const z1 = z + zSpans[zi + 1];
      const vertices = {
        p000: [x0, y0, z0],
        p100: [x1, y0, z0],
        p110: [x1, y1, z0],
        p010: [x0, y1, z0],
        p001: [x0, y0, z1],
        p101: [x1, y0, z1],
        p111: [x1, y1, z1],
        p011: [x0, y1, z1]
      };
      const faces = [
        [vertices.p000, vertices.p001, vertices.p101, vertices.p100],
        [vertices.p010, vertices.p110, vertices.p111, vertices.p011]
      ];
      if (!occupied[xi - 1]?.[zi]) faces.push([vertices.p000, vertices.p010, vertices.p011, vertices.p001]);
      if (!occupied[xi + 1]?.[zi]) faces.push([vertices.p100, vertices.p101, vertices.p111, vertices.p110]);
      if (!occupied[xi]?.[zi - 1]) faces.push([vertices.p000, vertices.p100, vertices.p110, vertices.p010]);
      if (!occupied[xi]?.[zi + 1]) faces.push([vertices.p001, vertices.p011, vertices.p111, vertices.p101]);
      triangles.push(...facesToTriangles(faces));
    }
  }
  return triangles;
}

function doorPanelTriangles(x, y, z) {
  const { xSpans, zSpans, cells } = doorPanelGrid();
  const backY = y + DOOR_THICKNESS_MM;
  const faces = [];

  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
      if (!cells[xi][zi].occupied) continue;
      const depth = cells[xi][zi].depth;
      const x0 = x + xSpans[xi];
      const x1 = x + xSpans[xi + 1];
      const z0 = z + zSpans[zi];
      const z1 = z + zSpans[zi + 1];
      faces.push([
        [x0, y + depth, z0],
        [x1, y + depth, z0],
        [x1, y + depth, z1],
        [x0, y + depth, z1]
      ]);
      faces.push([
        [x0, backY, z0],
        [x0, backY, z1],
        [x1, backY, z1],
        [x1, backY, z0]
      ]);

      const left = cells[xi - 1]?.[zi] || null;
      const right = cells[xi + 1]?.[zi] || null;
      const lower = cells[xi]?.[zi - 1] || null;
      const upper = cells[xi]?.[zi + 1] || null;
      if (!left?.occupied || left.depth !== depth) {
        const neighborDepth = left?.occupied ? left.depth : DOOR_THICKNESS_MM;
        faces.push(edgeFaceX(x0, y, z0, z1, depth, neighborDepth));
      }
      if (!right?.occupied) {
        faces.push(edgeFaceX(x1, y, z0, z1, depth, DOOR_THICKNESS_MM));
      }
      if (!lower?.occupied || lower.depth !== depth) {
        const neighborDepth = lower?.occupied ? lower.depth : DOOR_THICKNESS_MM;
        faces.push(edgeFaceZ(z0, y, x0, x1, depth, neighborDepth));
      }
      if (!upper?.occupied) {
        faces.push(edgeFaceZ(z1, y, x0, x1, depth, DOOR_THICKNESS_MM));
      }
    }
  }

  return facesToTriangles(faces);
}

function edgeFaceX(x, y, z0, z1, depth, neighborDepth) {
  const y0 = y + Math.min(depth, neighborDepth);
  const y1 = y + Math.max(depth, neighborDepth);
  return [[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]];
}

function edgeFaceZ(z, y, x0, x1, depth, neighborDepth) {
  const y0 = y + Math.min(depth, neighborDepth);
  const y1 = y + Math.max(depth, neighborDepth);
  return [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
}

function doorPanelGrid() {
  const r = DOOR_RAIL_MM;
  const center0 = CELL_SIZE_MM / 2 - WINDOW_BAR_MM / 2;
  const center1 = CELL_SIZE_MM / 2 + WINDOW_BAR_MM / 2;
  const handle0 = CELL_SIZE_MM * 0.68;
  const handle1 = CELL_SIZE_MM * 0.8;
  const handleZ0 = CELL_SIZE_MM * 0.58;
  const handleZ1 = CELL_SIZE_MM * 0.76;
  const xSpans = uniqueSorted([0, r, center0, center1, handle0, handle1, CELL_SIZE_MM - r, CELL_SIZE_MM]);
  const zSpans = uniqueSorted([0, r, handleZ0, handleZ1, CELL_SIZE_MM, CELL_SIZE_MM + r, CELL_SIZE_MM + center0, CELL_SIZE_MM + center1, CELL_SIZE_MM * 2 - r, CELL_SIZE_MM * 2]);
  const cells = [];
  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    cells[xi] = [];
    for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
      const x0 = xSpans[xi];
      const x1 = xSpans[xi + 1];
      const z0 = zSpans[zi];
      const z1 = zSpans[zi + 1];
      const lowerHalf = z1 <= CELL_SIZE_MM;
      const upperFrame = z0 >= CELL_SIZE_MM && (
        x0 < r
        || x1 > CELL_SIZE_MM - r
        || z0 < CELL_SIZE_MM + r
        || z1 > CELL_SIZE_MM * 2 - r
        || (x0 < center1 && x1 > center0)
        || (z0 < CELL_SIZE_MM + center1 && z1 > CELL_SIZE_MM + center0)
      );
      const lowerRaised = lowerHalf && (
        x0 < r
        || x1 > CELL_SIZE_MM - r
        || z0 < r
        || z1 > CELL_SIZE_MM - r
        || (x0 >= handle0 && x1 <= handle1 && z0 >= handleZ0 && z1 <= handleZ1)
      );
      cells[xi][zi] = {
        occupied: lowerHalf || upperFrame,
        depth: lowerRaised || upperFrame ? 0 : DOOR_BACK_RECESS_MM
      };
    }
  }
  return { xSpans, zSpans, cells };
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => Number(value.toFixed(6))))].sort((a, b) => a - b);
}

function seededUnit(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function cubeVertices(min, max) {
  return {
    p000: [min[0], min[1], min[2]],
    p100: [max[0], min[1], min[2]],
    p110: [max[0], max[1], min[2]],
    p010: [min[0], max[1], min[2]],
    p001: [min[0], min[1], max[2]],
    p101: [max[0], min[1], max[2]],
    p111: [max[0], max[1], max[2]],
    p011: [min[0], max[1], max[2]]
  };
}

function neighborAt(project, block, face) {
  const offsets = {
    bottom: [0, 0, -1],
    top: [0, 0, 1],
    east: [1, 0, 0],
    west: [-1, 0, 0],
    north: [0, 1, 0],
    south: [0, -1, 0]
  };
  const [dx, dy, dz] = offsets[face];
  const position = { x: block.x + dx, y: block.y + dy, z: block.z + dz };
  return project.blocks.find((other) => blockOccupies(other, position)) || null;
}

function blockOccupies(block, position) {
  const heightCells = block.shape === "door_panel" ? 2 : 1;
  return block.x === position.x
    && block.y === position.y
    && position.z >= block.z
    && position.z < block.z + heightCells;
}

function shouldEmitCubeFace(project, block, face) {
  const neighbor = neighborAt(project, block, face);
  if (!neighbor) return true;
  return neighbor.shape !== "cube";
}

function hasAnyNeighbor(project, block) {
  if (!project) return false;
  return ["bottom", "top", "east", "west", "north", "south"].some((face) => neighborAt(project, block, face));
}

function triangularPrismTriangles(x, y, z, height, block, project) {
  const size = CELL_SIZE_MM;
  const weld = hasAnyNeighbor(project, block) ? PRISM_WELD_OVERLAP_MM : 0;
  const x0 = x - weld;
  const x1 = x + size + weld;
  const y0 = y - weld;
  const y1 = y + size + weld;
  const z0 = z > 0 ? z - weld : z;
  const h = Math.min(height, size);
  const a = [x0, y0, z0];
  const b = [x1, y0, z0];
  const c = [x1, y0, z + h];
  const d = [x0, y1, z0];
  const e = [x1, y1, z0];
  const f = [x1, y1, z + h];
  const faces = [
    [a, b, c],
    [d, f, e],
    [a, d, e, b],
    [b, e, f, c],
    [c, f, d, a]
  ];
  return rotateTrianglesZ(facesToTriangles(faces), [x + size / 2, y + size / 2], block.rotation || 0);
}

function facesToTriangles(faces) {
  const triangles = [];
  for (const face of faces) {
    if (face.length === 3) {
      triangles.push([face[0], face[1], face[2]]);
      continue;
    }
    triangles.push([face[0], face[1], face[2]]);
    triangles.push([face[0], face[2], face[3]]);
  }
  return triangles;
}

function rotateTrianglesZ(triangles, center, degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 0) return triangles;
  const radians = (normalized * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  return triangles.map((triangle) => triangle.map((point) => {
    const dx = point[0] - center[0];
    const dy = point[1] - center[1];
    return [
      center[0] + dx * cos - dy * sin,
      center[1] + dx * sin + dy * cos,
      point[2]
    ];
  }));
}

function stringifyAsciiStl(name, triangles) {
  const lines = [`solid ${safeName(name)}`];
  for (const triangle of triangles) {
    const normal = computeNormal(triangle);
    lines.push(`  facet normal ${normal.join(" ")}`);
    lines.push("    outer loop");
    for (const vertex of triangle) {
      lines.push(`      vertex ${vertex.map((value) => round(value)).join(" ")}`);
    }
    lines.push("    endloop");
    lines.push("  endfacet");
  }
  lines.push(`endsolid ${safeName(name)}`);
  return `${lines.join("\n")}\n`;
}

function computeNormal([a, b, c]) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0]
  ];
  const length = Math.hypot(n[0], n[1], n[2]) || 1;
  return n.map((value) => round(value / length));
}

function triangleArea([a, b, c]) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cross = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0]
  ];
  return Math.hypot(cross[0], cross[1], cross[2]) / 2;
}

function round(value) {
  return Number(value.toFixed(6));
}

function safeName(name) {
  return String(name).replace(/[^\w-]+/g, "_");
}
