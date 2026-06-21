import { CELL_SIZE_MM, MATERIALS, PRINT_DEFAULTS, SHAPES } from "./constants.js";

export function exportAsciiStl(project, name = project.name || "model_3d_print") {
  const triangles = [];
  for (const block of project.blocks) {
    triangles.push(...trianglesForBlock(block));
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
      "已保留材質浮雕、R角和接縫需求的輸出路徑"
    ]
  };
}

export function reliefTrianglesForBlock(project, block) {
  const material = MATERIALS[block.material] || MATERIALS.brick;
  const depth = Math.min(material.reliefDepthMm, PRINT_DEFAULTS.maxReliefMm);
  const x = block.x * CELL_SIZE_MM;
  const y = block.y * CELL_SIZE_MM;
  const z = block.z * CELL_SIZE_MM;
  const size = CELL_SIZE_MM;
  const top = z + (SHAPES[block.shape]?.maxHeightMm || CELL_SIZE_MM);
  const boxes = [];

  if (isFaceExposed(project, block, "top")) {
    boxes.push(...faceReliefBoxes(block, "top", x, y, z, size, top - z, depth));
  }
  if (isFaceExposed(project, block, "east")) {
    boxes.push(...faceReliefBoxes(block, "east", x, y, z, size, top - z, depth));
  }
  if (isFaceExposed(project, block, "west")) {
    boxes.push(...faceReliefBoxes(block, "west", x, y, z, size, top - z, depth));
  }
  if (isFaceExposed(project, block, "north")) {
    boxes.push(...faceReliefBoxes(block, "north", x, y, z, size, top - z, depth));
  }
  if (isFaceExposed(project, block, "south")) {
    boxes.push(...faceReliefBoxes(block, "south", x, y, z, size, top - z, depth));
  }
  return boxes.flatMap((box) => cuboidTriangles(box.min, box.max));
}

export function trianglesForBlock(block) {
  const x = block.x * CELL_SIZE_MM;
  const y = block.y * CELL_SIZE_MM;
  const z = block.z * CELL_SIZE_MM;
  if (block.shape === "prism_30") {
    return triangularPrismTriangles(x, y, z, Math.tan(Math.PI / 6) * CELL_SIZE_MM, block);
  }
  if (block.shape === "prism_45") {
    return triangularPrismTriangles(x, y, z, CELL_SIZE_MM, block);
  }
  return cubeTriangles(x, y, z, CELL_SIZE_MM, block);
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

function cubeTriangles(x, y, z, size, block) {
  return roundedBoxTriangles(x, y, z, size, PRINT_DEFAULTS.roundedEdgeRadiusMm, 5);
}

function cuboidTriangles(min, max) {
  const vertices = {
    p000: [min[0], min[1], min[2]],
    p100: [max[0], min[1], min[2]],
    p110: [max[0], max[1], min[2]],
    p010: [min[0], max[1], min[2]],
    p001: [min[0], min[1], max[2]],
    p101: [max[0], min[1], max[2]],
    p111: [max[0], max[1], max[2]],
    p011: [min[0], max[1], max[2]]
  };
  return facesToTriangles([
    [vertices.p000, vertices.p100, vertices.p110, vertices.p010],
    [vertices.p001, vertices.p011, vertices.p111, vertices.p101],
    [vertices.p000, vertices.p001, vertices.p101, vertices.p100],
    [vertices.p100, vertices.p101, vertices.p111, vertices.p110],
    [vertices.p110, vertices.p111, vertices.p011, vertices.p010],
    [vertices.p010, vertices.p011, vertices.p001, vertices.p000]
  ]);
}

function reliefBox(x1, y1, z1, x2, y2, z2) {
  return {
    min: [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)],
    max: [Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)]
  };
}

function isFaceExposed(project, block, face) {
  const offsets = {
    top: [0, 0, 1],
    east: [1, 0, 0],
    west: [-1, 0, 0],
    north: [0, 1, 0],
    south: [0, -1, 0]
  };
  const [dx, dy, dz] = offsets[face];
  return !project.blocks.some((other) => other.x === block.x + dx && other.y === block.y + dy && other.z === block.z + dz);
}

function faceReliefBoxes(block, face, x, y, z, size, height, depth) {
  const seed = `${block.textureSeed || block.material}-${face}-${block.rotation || 0}`;
  const rects = materialReliefRects(block.material, seed, size, Math.max(height, PRINT_DEFAULTS.minFeatureMm));
  return rects.map((rect) => rectToFaceBox(rect, face, x, y, z, size, height, depth));
}

function materialReliefRects(material, seed, width, height) {
  if (material === "brick") return brickReliefRects(seed, width, height);
  if (material === "wood") return woodReliefRects(seed, width, height);
  if (material === "stone_slab") return stoneReliefRects(seed, width, height);
  return woolReliefRects(seed, width, height);
}

function brickReliefRects(seed, width, height) {
  const rng = seededRandom(seed);
  const rects = [];
  const mortar = 1.35;
  const rows = height < 35 ? 3 : 4;
  const rowHeight = (height - mortar * (rows + 1)) / rows;

  for (let row = 0; row < rows; row += 1) {
    const v1 = mortar + row * (rowHeight + mortar);
    const v2 = v1 + rowHeight;
    const cuts = row % 2 === 0
      ? [0, width * (0.48 + rng() * 0.08), width]
      : [0, width * (0.30 + rng() * 0.05), width * (0.66 + rng() * 0.06), width];
    for (let i = 0; i < cuts.length - 1; i += 1) {
      pushRect(rects, cuts[i] + mortar, v1, cuts[i + 1] - mortar, v2, 0.92 + rng() * 0.16);
    }
  }
  return rects;
}

function woodReliefRects(seed, width, height) {
  const rng = seededRandom(seed);
  const rects = [];
  const lines = 9;
  for (let i = 0; i < lines; i += 1) {
    let cursor = 4 + rng() * 4;
    const base = 4 + i * ((height - 8) / (lines - 1)) + (rng() - 0.5) * 2;
    const thickness = 0.8 + rng() * 1.2;
    while (cursor < width - 5) {
      const segment = 8 + rng() * 13;
      const drift = (rng() - 0.5) * 3;
      pushRect(rects, cursor, base + drift, Math.min(width - 4, cursor + segment), base + drift + thickness, 0.45 + rng() * 0.35);
      cursor += segment + 2 + rng() * 5;
    }
  }
  const knots = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < knots; i += 1) {
    const cx = 14 + rng() * (width - 28);
    const cy = 14 + rng() * (height - 28);
    pushRect(rects, cx - 7, cy - 1.2, cx + 7, cy + 1.2, 0.9);
    pushRect(rects, cx - 1.2, cy - 5, cx + 1.2, cy + 5, 0.75);
    pushRect(rects, cx - 4, cy - 4, cx + 4, cy - 2.2, 0.55);
    pushRect(rects, cx - 4, cy + 2.2, cx + 4, cy + 4, 0.55);
  }
  return rects;
}

function stoneReliefRects(seed, width, height) {
  const rng = seededRandom(seed);
  const rects = [];
  const gap = 1.2;
  const columns = jitteredCuts(width, [0, 0.31, 0.58, 0.82, 1], rng, 2.8);
  const rows = jitteredCuts(height, [0, 0.28, 0.55, 0.78, 1], rng, 2.6);
  for (let row = 0; row < rows.length - 1; row += 1) {
    for (let col = 0; col < columns.length - 1; col += 1) {
      const inset = gap + rng() * 0.8;
      pushRect(
        rects,
        columns[col] + inset,
        rows[row] + inset,
        columns[col + 1] - inset,
        rows[row + 1] - inset,
        0.78 + rng() * 0.22
      );
    }
  }
  return rects;
}

function woolReliefRects(seed, width, height) {
  const rng = seededRandom(seed);
  const rects = [];
  const spacing = 5.5;
  for (let v = 4; v < height - 4; v += spacing) {
    const offset = (rng() - 0.5) * 1.5;
    pushRect(rects, 4, v + offset, width - 4, v + offset + 0.9, 0.45);
  }
  for (let u = 5.5; u < width - 4; u += spacing) {
    const offset = (rng() - 0.5) * 1.5;
    pushRect(rects, u + offset, 4, u + offset + 0.85, height - 4, 0.35);
  }
  for (let i = 0; i < 10; i += 1) {
    const u = 5 + rng() * (width - 10);
    const v = 5 + rng() * (height - 10);
    pushRect(rects, u, v, u + 3 + rng() * 4, v + 0.7, 0.5);
  }
  return rects;
}

function pushRect(rects, u1, v1, u2, v2, heightScale = 1) {
  const minU = Math.max(PRINT_DEFAULTS.minFeatureMm, Math.min(u1, u2));
  const maxU = Math.min(CELL_SIZE_MM - PRINT_DEFAULTS.minFeatureMm, Math.max(u1, u2));
  const minV = Math.max(PRINT_DEFAULTS.minFeatureMm, Math.min(v1, v2));
  const maxV = Math.min(CELL_SIZE_MM - PRINT_DEFAULTS.minFeatureMm, Math.max(v1, v2));
  if (maxU - minU < PRINT_DEFAULTS.minFeatureMm || maxV - minV < PRINT_DEFAULTS.minFeatureMm) return;
  rects.push({ u1: minU, v1: minV, u2: maxU, v2: maxV, heightScale });
}

function rectToFaceBox(rect, face, x, y, z, size, height, depth) {
  const relief = Math.max(PRINT_DEFAULTS.minFeatureMm, depth * rect.heightScale);
  const top = z + height;
  if (face === "top") {
    return reliefBox(x + rect.u1, y + rect.v1, top, x + rect.u2, y + rect.v2, top + relief);
  }
  if (face === "east") {
    return reliefBox(x + size, y + rect.u1, z + rect.v1, x + size + relief, y + rect.u2, z + rect.v2);
  }
  if (face === "west") {
    return reliefBox(x - relief, y + rect.u1, z + rect.v1, x, y + rect.u2, z + rect.v2);
  }
  if (face === "north") {
    return reliefBox(x + rect.u1, y + size, z + rect.v1, x + rect.u2, y + size + relief, z + rect.v2);
  }
  return reliefBox(x + rect.u1, y - relief, z + rect.v1, x + rect.u2, y, z + rect.v2);
}

function jitteredCuts(size, fractions, rng, jitter) {
  return fractions.map((fraction, index) => {
    if (index === 0) return 0;
    if (index === fractions.length - 1) return size;
    return size * fraction + (rng() - 0.5) * jitter;
  }).sort((a, b) => a - b);
}

function seededRandom(seed) {
  let value = hashString(seed);
  return () => {
    value |= 0;
    value = (value + 0x6D2B79F5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input) {
  let hash = 2166136261;
  for (const char of String(input)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function triangularPrismTriangles(x, y, z, height, block) {
  const size = CELL_SIZE_MM;
  const relief = reliefOffset(block);
  const h = Math.min(height + relief, size);
  const a = [x, y, z];
  const b = [x + size, y, z];
  const c = [x + size, y, z + h];
  const d = [x, y + size, z];
  const e = [x + size, y + size, z];
  const f = [x + size, y + size, z + h];
  return [
    [a, b, c],
    [d, f, e],
    ...facesToTriangles([
      [a, d, e, b],
      [b, e, f, c],
      [c, f, d, a]
    ])
  ];
}

function roundedBoxTriangles(x, y, z, size, radius, segments) {
  const center = [x + size / 2, y + size / 2, z + size / 2];
  const half = size / 2;
  const inner = half - radius;
  const triangles = [];
  const axes = [
    { axis: 0, sign: 1 },
    { axis: 0, sign: -1 },
    { axis: 1, sign: 1 },
    { axis: 1, sign: -1 },
    { axis: 2, sign: 1 },
    { axis: 2, sign: -1 }
  ];

  for (const face of axes) {
    const uAxis = face.axis === 0 ? 1 : 0;
    const vAxis = face.axis === 2 ? 1 : 2;
    const grid = [];
    for (let i = 0; i <= segments; i += 1) {
      const row = [];
      for (let j = 0; j <= segments; j += 1) {
        const p = [0, 0, 0];
        p[face.axis] = face.sign * half;
        p[uAxis] = -half + (size * i) / segments;
        p[vAxis] = -half + (size * j) / segments;
        row.push(roundBoxPoint(p, center, inner, radius));
      }
      grid.push(row);
    }
    for (let i = 0; i < segments; i += 1) {
      for (let j = 0; j < segments; j += 1) {
        const a = grid[i][j];
        const b = grid[i + 1][j];
        const c = grid[i + 1][j + 1];
        const d = grid[i][j + 1];
        if (face.sign > 0) {
          triangles.push([a, b, c], [a, c, d]);
        } else {
          triangles.push([a, c, b], [a, d, c]);
        }
      }
    }
  }
  return triangles;
}

function roundBoxPoint(point, center, inner, radius) {
  const clamped = point.map((value) => Math.max(-inner, Math.min(inner, value)));
  const delta = point.map((value, index) => value - clamped[index]);
  const length = Math.hypot(delta[0], delta[1], delta[2]) || 1;
  return clamped.map((value, index) => center[index] + value + (delta[index] / length) * radius);
}

function facesToTriangles(faces) {
  const triangles = [];
  for (const face of faces) {
    triangles.push([face[0], face[1], face[2]]);
    triangles.push([face[0], face[2], face[3]]);
  }
  return triangles;
}

function reliefOffset(block) {
  const material = MATERIALS[block.material] || MATERIALS.brick;
  return Math.min(material.reliefDepthMm, PRINT_DEFAULTS.maxReliefMm);
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
