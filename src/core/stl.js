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
    boxes.push(...topReliefBoxes(block.material, x, y, top, size, depth));
  }
  if (isFaceExposed(project, block, "east")) {
    boxes.push(...sideReliefBoxes(block.material, x + size, y, z, "east", size, depth));
  }
  if (isFaceExposed(project, block, "north")) {
    boxes.push(...sideReliefBoxes(block.material, x, y + size, z, "north", size, depth));
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

function topReliefBoxes(material, x, y, z, size, depth) {
  if (material === "brick") {
    return [
      reliefBox(x + 8, y + 22, z, x + 42, y + 25, z + depth),
      reliefBox(x + 24, y + 6, z, x + 27, y + 22, z + depth),
      reliefBox(x + 12, y + 36, z, x + 46, y + 39, z + depth)
    ];
  }
  if (material === "wood") {
    return [
      reliefBox(x + 6, y + 12, z, x + 44, y + 15, z + depth),
      reliefBox(x + 12, y + 26, z, x + 48, y + 29, z + depth),
      reliefBox(x + 8, y + 38, z, x + 38, y + 41, z + depth)
    ];
  }
  if (material === "stone_slab") {
    return [
      reliefBox(x + 7, y + 10, z, x + 22, y + 15, z + depth),
      reliefBox(x + 30, y + 18, z, x + 44, y + 22, z + depth),
      reliefBox(x + 16, y + 36, z, x + 40, y + 40, z + depth)
    ];
  }
  return [
    reliefBox(x + 8, y + 12, z, x + 42, y + 14, z + depth),
    reliefBox(x + 10, y + 24, z, x + 46, y + 26, z + depth),
    reliefBox(x + 6, y + 36, z, x + 38, y + 38, z + depth)
  ];
}

function sideReliefBoxes(material, x, y, z, face, size, depth) {
  const spans = material === "wood"
    ? [[10, 13], [24, 27], [38, 41]]
    : [[12, 16], [28, 32], [40, 44]];
  return spans.map(([a, b]) => {
    if (face === "east") {
      return reliefBox(x, y + a, z + 10, x + depth, y + b, z + size - 10);
    }
    return reliefBox(x + a, y, z + 10, x + b, y + depth, z + size - 10);
  });
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
    north: [0, 1, 0]
  };
  const [dx, dy, dz] = offsets[face];
  return !project.blocks.some((other) => other.x === block.x + dx && other.y === block.y + dy && other.z === block.z + dz);
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
