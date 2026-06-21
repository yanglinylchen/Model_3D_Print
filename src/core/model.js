import {
  CELL_SIZE_MM,
  DEFAULT_WORKSPACE_CELLS,
  MATERIALS,
  MAX_BLOCKS,
  MAX_WORKSPACE_CELLS,
  PROJECT_EXTENSION,
  SHAPES
} from "./constants.js";

export function blockKey({ x, y, z }) {
  return `${x},${y},${z}`;
}

export function cloneProject(project) {
  return JSON.parse(JSON.stringify(project));
}

export function createProject({ name = "未命名模型", workspaceCells = DEFAULT_WORKSPACE_CELLS } = {}) {
  assertWorkspace(workspaceCells);
  return {
    schemaVersion: "0.1",
    name,
    blockSizeMm: CELL_SIZE_MM,
    workspaceCells: { ...workspaceCells },
    materials: Object.keys(MATERIALS),
    blocks: []
  };
}

export function normalizeProject(input) {
  const project = createProject({
    name: input?.name || "未命名模型",
    workspaceCells: input?.workspaceCells || DEFAULT_WORKSPACE_CELLS
  });
  project.schemaVersion = input?.schemaVersion || "0.1";
  project.blockSizeMm = input?.blockSizeMm || CELL_SIZE_MM;
  project.materials = Array.isArray(input?.materials) ? input.materials : Object.keys(MATERIALS);
  project.blocks = Array.isArray(input?.blocks) ? input.blocks.map(normalizeBlock) : [];
  validateProject(project);
  return project;
}

export function validateProject(project) {
  assertWorkspace(project.workspaceCells);
  if (project.blockSizeMm !== CELL_SIZE_MM) {
    throw new Error(`目前只支援 ${CELL_SIZE_MM}mm 方塊尺寸。`);
  }
  if (project.blocks.length > MAX_BLOCKS) {
    throw new Error(`方塊數超過上限 ${MAX_BLOCKS}。`);
  }
  const occupied = new Set();
  for (const block of project.blocks) {
    assertBlockInside(block, project.workspaceCells);
    if (occupied.has(blockKey(block))) {
      throw new Error(`格子 ${blockKey(block)} 已有方塊。`);
    }
    occupied.add(blockKey(block));
  }
  const unsupported = findUnsupportedRoofBlocks(project);
  if (unsupported.length > 0) {
    throw new Error(`有 ${unsupported.length} 個方塊缺少斜面上方支撐。`);
  }
  return true;
}

export function normalizeBlock(block) {
  const material = block.material
    ? (MATERIALS[block.material] ? block.material : "plain")
    : "brick";
  const normalized = {
    x: Number(block.x),
    y: Number(block.y),
    z: Number(block.z),
    shape: block.shape || "cube",
    material,
    rotation: Number(block.rotation || 0),
    textureSeed: block.textureSeed || createTextureSeed(material)
  };
  if (!SHAPES[normalized.shape]) {
    throw new Error(`不支援的形狀：${normalized.shape}`);
  }
  return normalized;
}

export function createTextureSeed(materialId) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${materialId}-${Date.now().toString(36)}-${random}`;
}

export function makeBlock({ x, y, z, shape = "cube", material = "brick", rotation = 0, textureSeed }) {
  return normalizeBlock({
    x,
    y,
    z,
    shape,
    material,
    rotation,
    textureSeed: textureSeed || createTextureSeed(material)
  });
}

export function getBlock(project, position) {
  const key = blockKey(position);
  return project.blocks.find((block) => blockKey(block) === key) || null;
}

export function setBlock(project, block) {
  const next = cloneProject(project);
  const normalized = normalizeBlock(block);
  const validation = validatePlacement(next, normalized);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason, project };
  }
  next.blocks = next.blocks.filter((item) => blockKey(item) !== blockKey(normalized));
  next.blocks.push(normalized);
  return { ok: true, project: next, block: normalized };
}

export function removeBlock(project, position) {
  const next = cloneProject(project);
  const key = blockKey(position);
  const before = next.blocks.length;
  next.blocks = next.blocks.filter((block) => blockKey(block) !== key);
  const unsupported = findUnsupportedRoofBlocks(next);
  if (unsupported.length > 0) {
    return {
      ok: false,
      reason: "清除後會讓斜面上方的方塊失去支撐，因此已禁止清除。",
      project,
      unsupported
    };
  }
  return { ok: before !== next.blocks.length, project: next };
}

export function changeBlockMaterial(project, position, material) {
  if (!MATERIALS[material]) {
    return { ok: false, reason: "不支援的材質。", project };
  }
  const next = cloneProject(project);
  const block = getBlock(next, position);
  if (!block) {
    return { ok: false, reason: "尚未選取方塊。", project };
  }
  block.material = material;
  block.textureSeed = createTextureSeed(material);
  return { ok: true, project: next, block };
}

export function copyBlock(block) {
  return block ? normalizeBlock(block) : null;
}

export function pasteBlock(project, copiedBlock, targetPosition) {
  if (!copiedBlock) {
    return { ok: false, reason: "沒有可貼上的方塊。", project };
  }
  return setBlock(project, {
    ...copiedBlock,
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z
  });
}

export function rotateBlock(project, position, degrees = 90) {
  const next = cloneProject(project);
  const block = getBlock(next, position);
  if (!block) {
    return { ok: false, reason: "尚未選取方塊。", project };
  }
  block.rotation = normalizeRotation(block.rotation + degrees);
  return { ok: true, project: next, block };
}

export function alignMaterialOrientation(project, material) {
  const next = cloneProject(project);
  for (const block of next.blocks) {
    if (block.material === material) {
      block.rotation = 0;
    }
  }
  return { ok: true, project: next };
}

export function resizeWorkspace(project, workspaceCells) {
  const target = {
    x: Number(workspaceCells.x),
    y: Number(workspaceCells.y),
    z: Number(workspaceCells.z)
  };
  assertWorkspace(target);
  const outside = project.blocks.filter((block) => !isInsideWorkspace(block, target));
  if (outside.length > 0) {
    return {
      ok: false,
      reason: "縮小後會有方塊超出邊界，因此已禁止調整。",
      outside
    };
  }
  const next = cloneProject(project);
  next.workspaceCells = target;
  return { ok: true, project: next };
}

export function validatePlacement(project, block) {
  try {
    assertBlockInside(block, project.workspaceCells);
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  if (project.blocks.length >= MAX_BLOCKS && !getBlock(project, block)) {
    return { ok: false, reason: `方塊數已達上限 ${MAX_BLOCKS}。` };
  }
  const below = getBlock(project, { x: block.x, y: block.y, z: block.z - 1 });
  if (below && SHAPES[below.shape]?.restrictedTop && !hasUpperBlockSupport(project, block)) {
    return {
      ok: false,
      reason: "這個位置下方是斜面方塊，必須先有前後左右或上方支撐才能放置。"
    };
  }
  return { ok: true };
}

export function hasUpperBlockSupport(project, block) {
  const supportPositions = [
    { x: block.x + 1, y: block.y, z: block.z },
    { x: block.x - 1, y: block.y, z: block.z },
    { x: block.x, y: block.y + 1, z: block.z },
    { x: block.x, y: block.y - 1, z: block.z },
    { x: block.x, y: block.y, z: block.z + 1 }
  ];
  return supportPositions.some((position) => getBlock(project, position));
}

export function findUnsupportedRoofBlocks(project) {
  return project.blocks.filter((block) => {
    const below = getBlock(project, { x: block.x, y: block.y, z: block.z - 1 });
    return below && SHAPES[below.shape]?.restrictedTop && !hasUpperBlockSupport(project, block);
  });
}

export function getThirtyDegreeHeightMm() {
  return SHAPES.prism_30.maxHeightMm;
}

export function getProjectFileName(name) {
  const safe = String(name || "model")
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "_");
  return `${safe || "model"}${PROJECT_EXTENSION}`;
}

function assertWorkspace(workspaceCells) {
  for (const axis of ["x", "y", "z"]) {
    const value = Number(workspaceCells?.[axis]);
    if (!Number.isInteger(value) || value < 1 || value > MAX_WORKSPACE_CELLS[axis]) {
      throw new Error(`工作空間 ${axis.toUpperCase()} 必須介於 1 到 ${MAX_WORKSPACE_CELLS[axis]} 格。`);
    }
  }
}

function assertBlockInside(block, workspaceCells) {
  if (!isInsideWorkspace(block, workspaceCells)) {
    throw new Error("方塊位置超出工作空間。");
  }
}

function isInsideWorkspace(block, workspaceCells) {
  return (
    Number.isInteger(block.x) &&
    Number.isInteger(block.y) &&
    Number.isInteger(block.z) &&
    block.x >= 0 &&
    block.y >= 0 &&
    block.z >= 0 &&
    block.x < workspaceCells.x &&
    block.y < workspaceCells.y &&
    block.z < workspaceCells.z
  );
}

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}
