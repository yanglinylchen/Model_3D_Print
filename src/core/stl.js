import { CELL_SIZE_MM } from "./constants.js";

const PRISM_WELD_OVERLAP_MM = 0.08;
const BRICK_RELIEF_RAISE_MM = 1;
const BRICK_RELIEF_EMBED_MM = 0.08;
const BRICK_MORTAR_GAP_MM = 1.2;
const BRICK_ROWS = 5;
const WINDOW_THICKNESS_MM = 10;
const WINDOW_BAR_MM = 8;

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
      "已將磚紋浮雕限制在外露側面，避免頂面干擾屋頂三角柱"
    ]
  };
}

export function reliefTrianglesForBlock(project, block) {
  if (!project || block.shape !== "cube" || block.material !== "brick") return [];
  const x = block.x * CELL_SIZE_MM;
  const y = block.y * CELL_SIZE_MM;
  const z = block.z * CELL_SIZE_MM;
  const triangles = [];
  for (const face of ["south", "east", "north", "west"]) {
    if (neighborAt(project, block, face)) continue;
    for (const [min, max] of brickSideReliefBoxes(x, y, z, CELL_SIZE_MM, face, block.textureSeed || "")) {
      triangles.push(...cuboidTriangles(min, max));
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
  if (block.shape === "window_cross") {
    return rotateTrianglesZ(windowCrossTriangles(x, y, z), [x + CELL_SIZE_MM / 2, y + CELL_SIZE_MM / 2], block.rotation || 0);
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
  return project.blocks.find((other) => other.x === block.x + dx && other.y === block.y + dy && other.z === block.z + dz) || null;
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
