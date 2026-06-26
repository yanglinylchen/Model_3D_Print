import * as THREE from "../../node_modules/three/build/three.module.js";
import {
  AUTOSAVE_INTERVAL_MS,
  CELL_SIZE_MM,
  DEFAULT_WORKSPACE_CELLS,
  MATERIALS,
  MAX_BLOCKS,
  SHAPES
} from "../core/constants.js";
import { ProjectHistory } from "../core/history.js";
import {
  alignMaterialOrientation,
  changeBlockMaterial,
  cloneProject,
  copyBlock,
  createProject,
  getBlock,
  getProjectFileName,
  makeBlock,
  normalizeProject,
  pasteBlock,
  removeBlock,
  resizeWorkspace,
  rotateBlock,
  setBlock
} from "../core/model.js";
import { exportAsciiStl } from "../core/stl.js";

const ASSET = new URL("../../assets/", import.meta.url).href;
const WINDOW_THICKNESS_MM = 10;
const WINDOW_BAR_MM = 8;
const FENCE_THICKNESS_MM = 10;
const FRAME_EDGE_MM = 5;
const DOOR_THICKNESS_MM = 10;
const DOOR_BACK_RECESS_MM = 2;
const DOOR_RAIL_MM = 7;
const DOOR_MID_RAIL_MM = 8;
const ROAD_THICKNESS_MM = 5;
const RIVER_THICKNESS_MM = 4;
const VIEW_DRAG_THRESHOLD_PX = 8;
const VIEW_DRAG_YAW_SPEED = 0.006;
const VIEW_DRAG_PITCH_SPEED = 0.0035;
const TOUCH_LONG_PRESS_DELETE_MS = 620;
const TOUCH_LONG_PRESS_MOVE_PX = 12;
const TOUCH_VIEW_PAN_STEP_MM = CELL_SIZE_MM * 0.38;
const TOUCH_BUTTON_REPEAT_DELAY_MS = 300;
const TOUCH_BUTTON_REPEAT_INTERVAL_MS = 95;
const SHAPE_ICON_LABELS = Object.freeze({
  cube: "■",
  prism_30: "◢",
  prism_45: "◿",
  stair_step: "▟",
  frame_cube: "□",
  window_cross: "⊞",
  fence_panel: "▥",
  door_panel: "▯",
  archway: "∩",
  roof_corner: "⌂",
  chimney: "▤",
  road: "═",
  river: "≈"
});
const SHAPE_ICON_ASSETS = Object.freeze({
  cube: `${ASSET}shape_icons/cube.svg`,
  prism_30: `${ASSET}shape_icons/prism_30.svg`,
  prism_45: `${ASSET}shape_icons/prism_45.svg`,
  stair_step: `${ASSET}shape_icons/stair_step.svg`,
  window_cross: `${ASSET}shape_icons/window_cross.svg`,
  fence_panel: `${ASSET}shape_icons/fence_panel.svg`,
  door_panel: `${ASSET}shape_icons/door_panel.svg`
});
const EXAMPLES = [
  { label: "小房子", path: `${ASSET}examples/small_house.m3dp` },
  { label: "石橋", path: `${ASSET}examples/stone_bridge.m3dp` },
  { label: "教室牌", path: `${ASSET}examples/classroom_sign.m3dp` },
  { label: "城牆", path: `${ASSET}examples/tower_wall.m3dp` }
];

const state = {
  project: createProject(),
  history: null,
  filePath: null,
  selectedMaterial: "brick",
  selectedShape: "cube",
  mouseMode: "place",
  selected: null,
  copied: null,
  cursor: { x: 0, y: 0, z: 0 },
  pendingRotation: 0,
  lastExplicitSaveAt: 0,
  lastAutosaveAt: 0,
  cameraAngle: Math.PI / 4,
  cameraPitch: 0.62,
  cameraLift: 0,
  cameraPan: { x: 0, y: 0 },
  pressedKeys: new Set(),
  viewportDrag: null,
  touchPointers: new Map(),
  viewportGesture: null,
  touchLongPressDelete: null,
  touchButtonRepeat: null,
  suppressTouchButtonClickUntil: 0,
  suppressNextClick: false,
  warning: ""
};
state.history = new ProjectHistory(state.project);

const elements = {
  canvas: document.getElementById("viewport"),
  materialList: document.getElementById("materialList"),
  shapeList: document.getElementById("shapeList"),
  exampleList: document.getElementById("exampleList"),
  selectionInfo: document.getElementById("selectionInfo"),
  selectedMaterial: document.getElementById("selectedMaterial"),
  workspaceX: document.getElementById("workspaceX"),
  workspaceY: document.getElementById("workspaceY"),
  workspaceZ: document.getElementById("workspaceZ"),
  blockCount: document.getElementById("blockCount"),
  autosaveState: document.getElementById("autosaveState"),
  exportState: document.getElementById("exportState"),
  cursorState: document.getElementById("cursorState"),
  modeState: document.getElementById("modeState"),
  warningState: document.getElementById("warningState"),
  placeMode: document.getElementById("placeMode"),
  selectMode: document.getElementById("selectMode"),
  touchShapeBar: document.getElementById("touchShapeBar"),
  touchMaterialBar: document.getElementById("touchMaterialBar"),
  touchWorkspaceToggle: document.getElementById("touchWorkspaceToggle"),
  touchWorkspacePanel: document.getElementById("touchWorkspacePanel"),
  touchWorkspaceX: document.getElementById("touchWorkspaceX"),
  touchWorkspaceY: document.getElementById("touchWorkspaceY"),
  touchWorkspaceZ: document.getElementById("touchWorkspaceZ"),
  recoverDialog: document.getElementById("recoverDialog")
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#dfe7e1");
const renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
const camera = new THREE.PerspectiveCamera(45, 1, 1, 6000);
const blockGroup = new THREE.Group();
const helperGroup = new THREE.Group();
scene.add(blockGroup, helperGroup);
scene.add(new THREE.AmbientLight("#ffffff", 0.46));
const skyLight = new THREE.HemisphereLight("#f7fffb", "#8fa09a", 0.42);
scene.add(skyLight);
const sun = new THREE.DirectionalLight("#ffffff", 1.35);
sun.position.set(500, -800, 1200);
const fillLight = new THREE.DirectionalLight("#d8eeff", 0.32);
fillLight.position.set(-700, 550, 450);
scene.add(sun);
scene.add(fillLight);

const cursorMaterial = new THREE.MeshBasicMaterial({
  color: "#16746d",
  transparent: true,
  opacity: 0.22,
  depthWrite: false
});
const cursorMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE_MM, CELL_SIZE_MM, CELL_SIZE_MM), cursorMaterial);
scene.add(cursorMesh);
const hitboxGeometry = new THREE.BoxGeometry(CELL_SIZE_MM, CELL_SIZE_MM, CELL_SIZE_MM);
const hitboxMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0,
  depthWrite: false
});
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

init();

function init() {
  renderMaterialControls();
  renderShapeControls();
  renderTouchMaterialBar();
  renderTouchShapeBar();
  renderExamples();
  bindControls();
  loadAutosavePrompt();
  updateWorkspaceInputs();
  renderProject();
  updateUi();
  setInterval(autosave, AUTOSAVE_INTERVAL_MS);
  requestAnimationFrame(tick);
}

function bindControls() {
  document.getElementById("newProject").addEventListener("click", newProject);
  document.getElementById("openProject").addEventListener("click", openProject);
  document.getElementById("saveProject").addEventListener("click", () => saveProject(false));
  document.getElementById("undo").addEventListener("click", undo);
  document.getElementById("redo").addEventListener("click", redo);
  elements.placeMode.addEventListener("click", () => setMouseMode("place"));
  elements.selectMode.addEventListener("click", () => setMouseMode("select"));
  document.getElementById("copyBlock").addEventListener("click", copySelected);
  document.getElementById("pasteBlock").addEventListener("click", pasteCopied);
  document.getElementById("eraseBlock").addEventListener("click", eraseSelected);
  document.getElementById("rotateBlock").addEventListener("click", rotateSelectedOrPending);
  document.getElementById("alignMaterial").addEventListener("click", alignCurrentMaterial);
  document.getElementById("exportStl").addEventListener("click", exportStl);
  document.getElementById("applyWorkspace").addEventListener("click", applyWorkspace);
  document.getElementById("touchApplyWorkspace").addEventListener("click", applyTouchWorkspace);
  elements.touchWorkspaceToggle.addEventListener("click", toggleTouchWorkspacePanel);
  document.getElementById("cameraLeft").addEventListener("click", () => rotateCamera(-0.2));
  document.getElementById("cameraRight").addEventListener("click", () => rotateCamera(0.2));
  elements.materialList.addEventListener("change", changeActiveMaterial);
  elements.shapeList.addEventListener("change", changeActiveShape);
  elements.selectedMaterial.addEventListener("change", changeSelectedMaterial);
  elements.canvas.addEventListener("click", handleViewportClick);
  elements.canvas.addEventListener("pointerdown", handleViewportPointerDown);
  elements.canvas.addEventListener("pointermove", handlePointerMove);
  elements.canvas.addEventListener("pointerup", handleViewportPointerUp);
  elements.canvas.addEventListener("pointercancel", handleViewportPointerCancel);
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("keyup", handleKeyup);
  elements.canvas.addEventListener("wheel", handleWheel, { passive: true });
  document.querySelectorAll("[data-touch-move]").forEach((button) => {
    bindRepeatingTouchButton(button, () => moveCursorByView(button.dataset.touchMove));
  });
  document.querySelectorAll("[data-touch-pan]").forEach((button) => {
    bindRepeatingTouchButton(button, () => panTouchView(button.dataset.touchPan));
  });
  document.querySelectorAll("[data-touch-command]").forEach((button) => {
    button.addEventListener("click", handleTouchCommandButton);
  });
}

function renderTouchMaterialBar() {
  elements.touchMaterialBar.innerHTML = "";
  for (const material of Object.values(MATERIALS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.material = material.id;
    button.title = `選擇${material.label}`;
    button.setAttribute("aria-label", `選擇${material.label}`);
    const swatch = document.createElement("span");
    swatch.className = "touch-material-swatch";
    swatch.style.background = material.color;
    button.append(swatch);
    button.addEventListener("click", () => selectTouchMaterial(material.id));
    elements.touchMaterialBar.append(button);
  }
}

function renderMaterialControls() {
  elements.materialList.innerHTML = "";
  elements.selectedMaterial.innerHTML = "";
  for (const material of Object.values(MATERIALS)) {
    const pickerOption = document.createElement("option");
    pickerOption.value = material.id;
    pickerOption.dataset.material = material.id;
    pickerOption.textContent = material.label;
    elements.materialList.append(pickerOption);

    const option = document.createElement("option");
    option.value = material.id;
    option.textContent = material.label;
    elements.selectedMaterial.append(option);
  }
}

function renderShapeControls() {
  elements.shapeList.innerHTML = "";
  for (const shape of Object.values(SHAPES)) {
    const option = document.createElement("option");
    option.value = shape.id;
    option.dataset.shape = shape.id;
    option.textContent = shape.label;
    elements.shapeList.append(option);
  }
}

function renderTouchShapeBar() {
  elements.touchShapeBar.innerHTML = "";
  for (const shape of Object.values(SHAPES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.shape = shape.id;
    button.title = `選擇${shape.label}`;
    button.setAttribute("aria-label", `選擇${shape.label}`);
    const iconAsset = SHAPE_ICON_ASSETS[shape.id];
    if (iconAsset) {
      const icon = document.createElement("img");
      icon.src = iconAsset;
      icon.alt = "";
      icon.draggable = false;
      button.append(icon);
    } else {
      const icon = document.createElement("span");
      icon.className = "touch-shape-glyph";
      icon.textContent = SHAPE_ICON_LABELS[shape.id] || shape.label.slice(0, 1);
      button.append(icon);
    }
    button.addEventListener("click", () => {
      state.selectedShape = shape.id;
      clampCursorToSelectedShape();
      updateUi();
    });
    elements.touchShapeBar.append(button);
  }
}

function renderExamples() {
  elements.exampleList.innerHTML = "";
  for (const example of EXAMPLES) {
    const button = document.createElement("button");
    button.className = "example-button";
    button.textContent = example.label;
    button.addEventListener("click", async () => {
      const response = await fetch(example.path);
      const data = await response.json();
      loadProject(normalizeProject(data), null);
      setWarning(`已載入完成範例：${example.label}`);
    });
    elements.exampleList.append(button);
  }
}

function renderProject() {
  blockGroup.clear();
  helperGroup.clear();
  const gridSize = Math.max(state.project.workspaceCells.x, state.project.workspaceCells.y) * CELL_SIZE_MM;
  const grid = new THREE.GridHelper(gridSize, Math.max(state.project.workspaceCells.x, state.project.workspaceCells.y), "#91a39a", "#c5d2ca");
  grid.rotation.x = Math.PI / 2;
  grid.position.set(
    (state.project.workspaceCells.x * CELL_SIZE_MM) / 2 - CELL_SIZE_MM / 2,
    (state.project.workspaceCells.y * CELL_SIZE_MM) / 2 - CELL_SIZE_MM / 2,
    -1
  );
  helperGroup.add(grid);

  const bounds = new THREE.Box3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(
      state.project.workspaceCells.x * CELL_SIZE_MM,
      state.project.workspaceCells.y * CELL_SIZE_MM,
      state.project.workspaceCells.z * CELL_SIZE_MM
    )
  );
  helperGroup.add(new THREE.Box3Helper(bounds, "#6f8580"));

  for (const block of state.project.blocks) {
    blockGroup.add(createBlockMesh(block));
    const hitbox = createBlockHitbox(block);
    if (hitbox) blockGroup.add(hitbox);
  }
  updateCursorMesh();
}

function createBlockMesh(block) {
  const material = new THREE.MeshStandardMaterial({
    color: fixedShapeColor(block.shape) || (MATERIALS[block.material]?.color || "#b84b3f"),
    map: fixedShapeColor(block.shape) ? null : createMaterialTexture(block.material, block.textureSeed),
    roughness: 0.8,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const geometry = createGeometry(block.shape);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    block.x * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    block.y * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    block.z * CELL_SIZE_MM + CELL_SIZE_MM / 2
  );
  mesh.rotation.z = THREE.MathUtils.degToRad(block.rotation || 0);
  mesh.userData.blockKey = `${block.x},${block.y},${block.z}`;
  mesh.userData.position = { x: block.x, y: block.y, z: block.z };
  if (block.shape === "frame_cube") {
    mesh.raycast = () => {};
  }
  if (state.selected && samePosition(block, state.selected)) {
    const outline = new THREE.BoxHelper(mesh, "#16746d");
    mesh.add(outline);
  }
  return mesh;
}

function createBlockHitbox(block) {
  if (block.shape !== "frame_cube") return null;
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.set(
    block.x * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    block.y * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    block.z * CELL_SIZE_MM + CELL_SIZE_MM / 2
  );
  hitbox.userData.blockKey = `${block.x},${block.y},${block.z}`;
  hitbox.userData.position = { x: block.x, y: block.y, z: block.z };
  return hitbox;
}

function createGeometry(shape) {
  if (shape === "stair_step") {
    return createStairStepGeometry();
  }
  if (shape === "frame_cube") {
    return createFrameCubeGeometry();
  }
  if (shape === "archway") {
    return createArchwayGeometry();
  }
  if (shape === "roof_corner") {
    return createRoofCornerGeometry();
  }
  if (shape === "chimney") {
    return createChimneyGeometry();
  }
  if (shape === "road") {
    return createSlabGeometry(ROAD_THICKNESS_MM);
  }
  if (shape === "river") {
    return createSlabGeometry(RIVER_THICKNESS_MM);
  }
  if (shape === "window_cross") {
    return createWindowCrossGeometry();
  }
  if (shape === "fence_panel") {
    return createFencePanelGeometry();
  }
  if (shape === "door_panel") {
    return createDoorPanelGeometry();
  }
  if (shape === "prism_30" || shape === "prism_45") {
    const height = shape === "prism_30" ? Math.tan(Math.PI / 6) * CELL_SIZE_MM : CELL_SIZE_MM;
    const s = CELL_SIZE_MM;
    const vertices = new Float32Array([
      -s / 2, -s / 2, -s / 2,
      s / 2, -s / 2, -s / 2,
      s / 2, -s / 2, -s / 2 + height,
      -s / 2, s / 2, -s / 2,
      s / 2, s / 2, -s / 2,
      s / 2, s / 2, -s / 2 + height
    ]);
    const indices = [
      0, 1, 2,
      3, 5, 4,
      0, 3, 4, 0, 4, 1,
      1, 4, 5, 1, 5, 2,
      2, 5, 3, 2, 3, 0
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  return new THREE.BoxGeometry(CELL_SIZE_MM, CELL_SIZE_MM, CELL_SIZE_MM);
}

function fixedShapeColor(shape) {
  if (shape === "fence_panel") return "#d8dad6";
  if (shape === "road") return "#3b3d3f";
  if (shape === "river") return "#2f8fb6";
  return null;
}

function createArchwayGeometry() {
  const s = CELL_SIZE_MM;
  const positions = [];
  const indices = [];
  appendBoxWithoutTop(positions, indices, [-s / 2, -s / 2, -s / 2], [-15, -s / 2 + DOOR_THICKNESS_MM, 50]);
  appendBoxWithoutTop(positions, indices, [15, -s / 2, -s / 2], [s / 2, -s / 2 + DOOR_THICKNESS_MM, 50]);
  appendArchwayTopPanel(positions, indices, 0, 50, 15, 75, DOOR_THICKNESS_MM, 18);
  return bufferGeometry(positions, indices);
}

function createRoofCornerGeometry() {
  const s = CELL_SIZE_MM;
  const z0 = -s / 2;
  const a = [-s / 2, -s / 2, z0];
  const b = [s / 2, -s / 2, z0];
  const c = [-s / 2, s / 2, z0];
  const d = [s / 2, s / 2, z0];
  const e = [s / 2, -s / 2, z0 + s];
  const f = [-s / 2, s / 2, z0 + s];
  const g = [s / 2, s / 2, z0 + s];
  const positions = [];
  const indices = [];
  for (const face of [
    [a, b, d, c],
    [a, e, b],
    [a, c, f],
    [b, e, g, d],
    [c, d, g, f],
    [a, g, e],
    [a, f, g]
  ]) {
    appendAnyFace(positions, indices, face);
  }
  return bufferGeometry(positions, indices);
}

function createChimneyGeometry() {
  const spans = [0, 10, 40, 50];
  const occupied = [];
  for (let xi = 0; xi < spans.length - 1; xi += 1) {
    occupied[xi] = [];
    for (let yi = 0; yi < spans.length - 1; yi += 1) {
      const x0 = spans[xi];
      const x1 = spans[xi + 1];
      const y0 = spans[yi];
      const y1 = spans[yi + 1];
      occupied[xi][yi] = x0 < 10 || x1 > 40 || y0 < 10 || y1 > 40;
    }
  }
  return createGridColumnGeometry(spans, spans, occupied, CELL_SIZE_MM);
}

function createSlabGeometry(thickness) {
  const geometry = new THREE.BoxGeometry(CELL_SIZE_MM, CELL_SIZE_MM, thickness);
  geometry.translate(0, 0, -CELL_SIZE_MM / 2 + thickness / 2);
  return geometry;
}

function createFencePanelGeometry() {
  const xSpans = [0, 7, 18, 22, 28, 32, 43, 50];
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
  return createGridPanelGeometry(xSpans, zSpans, occupied, FENCE_THICKNESS_MM);
}

function createGridPanelGeometry(xSpans, zSpans, occupied, thickness) {
  const s = CELL_SIZE_MM;
  const positions = [];
  const indices = [];
  const y0 = -s / 2;
  const y1 = y0 + thickness;
  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
      if (!occupied[xi][zi]) continue;
      const x0 = -s / 2 + xSpans[xi];
      const x1 = -s / 2 + xSpans[xi + 1];
      const z0 = -s / 2 + zSpans[zi];
      const z1 = -s / 2 + zSpans[zi + 1];
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
      appendFace(positions, indices, vertices.p000, vertices.p001, vertices.p101, vertices.p100);
      appendFace(positions, indices, vertices.p010, vertices.p110, vertices.p111, vertices.p011);
      if (!occupied[xi - 1]?.[zi]) appendFace(positions, indices, vertices.p000, vertices.p010, vertices.p011, vertices.p001);
      if (!occupied[xi + 1]?.[zi]) appendFace(positions, indices, vertices.p100, vertices.p101, vertices.p111, vertices.p110);
      if (!occupied[xi]?.[zi - 1]) appendFace(positions, indices, vertices.p000, vertices.p100, vertices.p110, vertices.p010);
      if (!occupied[xi]?.[zi + 1]) appendFace(positions, indices, vertices.p001, vertices.p011, vertices.p111, vertices.p101);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createStairStepGeometry() {
  const s = CELL_SIZE_MM;
  const h = s / 2;
  const y0 = -s / 2;
  const y1 = s / 2;
  const z0 = -s / 2;
  const a = [-s / 2, y0, z0];
  const b = [0, y0, z0];
  const c = [s / 2, y0, z0];
  const d = [s / 2, y0, z0 + h];
  const e = [s / 2, y0, z0 + s];
  const f = [0, y0, z0 + s];
  const g = [0, y0, z0 + h];
  const i = [-s / 2, y0, z0 + h];
  const A = [-s / 2, y1, z0];
  const B = [0, y1, z0];
  const C = [s / 2, y1, z0];
  const D = [s / 2, y1, z0 + h];
  const E = [s / 2, y1, z0 + s];
  const F = [0, y1, z0 + s];
  const G = [0, y1, z0 + h];
  const I = [-s / 2, y1, z0 + h];
  const positions = [];
  const indices = [];
  for (const face of [
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
  ]) {
    appendFace(positions, indices, ...face);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createFrameCubeGeometry() {
  const s = CELL_SIZE_MM;
  const spans = [0, FRAME_EDGE_MM, s - FRAME_EDGE_MM, s];
  const occupied = [];
  for (let xi = 0; xi < spans.length - 1; xi += 1) {
    occupied[xi] = [];
    for (let yi = 0; yi < spans.length - 1; yi += 1) {
      occupied[xi][yi] = [];
      for (let zi = 0; zi < spans.length - 1; zi += 1) {
        const exteriorAxes = [xi, yi, zi].filter((index) => index !== 1).length;
        occupied[xi][yi][zi] = exteriorAxes >= 2;
      }
    }
  }
  return createGridSolidGeometry(spans, spans, spans, occupied);
}

function createGridSolidGeometry(xSpans, ySpans, zSpans, occupied) {
  const s = CELL_SIZE_MM;
  const positions = [];
  const indices = [];
  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    for (let yi = 0; yi < ySpans.length - 1; yi += 1) {
      for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
        if (!occupied[xi][yi][zi]) continue;
        const x0 = -s / 2 + xSpans[xi];
        const x1 = -s / 2 + xSpans[xi + 1];
        const y0 = -s / 2 + ySpans[yi];
        const y1 = -s / 2 + ySpans[yi + 1];
        const z0 = -s / 2 + zSpans[zi];
        const z1 = -s / 2 + zSpans[zi + 1];
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
        if (!occupied[xi]?.[yi]?.[zi - 1]) appendFace(positions, indices, vertices.p000, vertices.p100, vertices.p110, vertices.p010);
        if (!occupied[xi]?.[yi]?.[zi + 1]) appendFace(positions, indices, vertices.p001, vertices.p011, vertices.p111, vertices.p101);
        if (!occupied[xi]?.[yi - 1]?.[zi]) appendFace(positions, indices, vertices.p000, vertices.p001, vertices.p101, vertices.p100);
        if (!occupied[xi + 1]?.[yi]?.[zi]) appendFace(positions, indices, vertices.p100, vertices.p101, vertices.p111, vertices.p110);
        if (!occupied[xi]?.[yi + 1]?.[zi]) appendFace(positions, indices, vertices.p110, vertices.p111, vertices.p011, vertices.p010);
        if (!occupied[xi - 1]?.[yi]?.[zi]) appendFace(positions, indices, vertices.p010, vertices.p011, vertices.p001, vertices.p000);
      }
    }
  }
  return bufferGeometry(positions, indices);
}

function createDoorPanelGeometry() {
  const s = CELL_SIZE_MM;
  const { xSpans, zSpans, cells } = doorPanelGrid();
  const backY = -s / 2 + DOOR_THICKNESS_MM;
  const positions = [];
  const indices = [];

  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    for (let zi = 0; zi < zSpans.length - 1; zi += 1) {
      if (!cells[xi][zi].occupied) continue;
      const depth = cells[xi][zi].depth;
      const x0 = -s / 2 + xSpans[xi];
      const x1 = -s / 2 + xSpans[xi + 1];
      const z0 = -s / 2 + zSpans[zi];
      const z1 = -s / 2 + zSpans[zi + 1];
      appendFace(
        positions,
        indices,
        [x0, -s / 2 + depth, z0],
        [x1, -s / 2 + depth, z0],
        [x1, -s / 2 + depth, z1],
        [x0, -s / 2 + depth, z1]
      );
      appendFace(
        positions,
        indices,
        [x0, backY, z0],
        [x0, backY, z1],
        [x1, backY, z1],
        [x1, backY, z0]
      );

      const left = cells[xi - 1]?.[zi] || null;
      const right = cells[xi + 1]?.[zi] || null;
      const lower = cells[xi]?.[zi - 1] || null;
      const upper = cells[xi]?.[zi + 1] || null;
      if (!left?.occupied || left.depth !== depth) {
        const neighborDepth = left?.occupied ? left.depth : DOOR_THICKNESS_MM;
        appendEdgeFaceX(positions, indices, x0, -s / 2, z0, z1, depth, neighborDepth);
      }
      if (!right?.occupied) {
        appendEdgeFaceX(positions, indices, x1, -s / 2, z0, z1, depth, DOOR_THICKNESS_MM);
      }
      if (!lower?.occupied || lower.depth !== depth) {
        const neighborDepth = lower?.occupied ? lower.depth : DOOR_THICKNESS_MM;
        appendEdgeFaceZ(positions, indices, z0, -s / 2, x0, x1, depth, neighborDepth);
      }
      if (!upper?.occupied) {
        appendEdgeFaceZ(positions, indices, z1, -s / 2, x0, x1, depth, DOOR_THICKNESS_MM);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function appendEdgeFaceX(positions, indices, x, y, z0, z1, depth, neighborDepth) {
  const y0 = y + Math.min(depth, neighborDepth);
  const y1 = y + Math.max(depth, neighborDepth);
  appendFace(positions, indices, [x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]);
}

function appendEdgeFaceZ(positions, indices, z, y, x0, x1, depth, neighborDepth) {
  const y0 = y + Math.min(depth, neighborDepth);
  const y1 = y + Math.max(depth, neighborDepth);
  appendFace(positions, indices, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
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

function createWindowCrossGeometry() {
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

  const positions = [];
  const indices = [];
  const y0 = -s / 2;
  const y1 = y0 + WINDOW_THICKNESS_MM;
  for (let xi = 0; xi < spans.length - 1; xi += 1) {
    for (let zi = 0; zi < spans.length - 1; zi += 1) {
      if (!occupied[xi][zi]) continue;
      const x0 = -s / 2 + spans[xi];
      const x1 = -s / 2 + spans[xi + 1];
      const z0 = -s / 2 + spans[zi];
      const z1 = -s / 2 + spans[zi + 1];
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
      appendFace(positions, indices, vertices.p000, vertices.p001, vertices.p101, vertices.p100);
      appendFace(positions, indices, vertices.p010, vertices.p110, vertices.p111, vertices.p011);
      if (!occupied[xi - 1]?.[zi]) appendFace(positions, indices, vertices.p000, vertices.p010, vertices.p011, vertices.p001);
      if (!occupied[xi + 1]?.[zi]) appendFace(positions, indices, vertices.p100, vertices.p101, vertices.p111, vertices.p110);
      if (!occupied[xi]?.[zi - 1]) appendFace(positions, indices, vertices.p000, vertices.p100, vertices.p110, vertices.p010);
      if (!occupied[xi]?.[zi + 1]) appendFace(positions, indices, vertices.p001, vertices.p011, vertices.p111, vertices.p101);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function appendFace(positions, indices, a, b, c, d) {
  const start = positions.length / 3;
  positions.push(...a, ...b, ...c, ...d);
  indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
}

function appendAnyFace(positions, indices, face) {
  const start = positions.length / 3;
  for (const point of face) positions.push(...point);
  if (face.length === 3) {
    indices.push(start, start + 1, start + 2);
  } else {
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
}

function appendBoxWithoutTop(positions, indices, min, max) {
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
  for (const face of [
    [vertices.p000, vertices.p100, vertices.p110, vertices.p010],
    [vertices.p000, vertices.p001, vertices.p101, vertices.p100],
    [vertices.p100, vertices.p101, vertices.p111, vertices.p110],
    [vertices.p110, vertices.p111, vertices.p011, vertices.p010],
    [vertices.p010, vertices.p011, vertices.p001, vertices.p000]
  ]) {
    appendFace(positions, indices, ...face);
  }
}

function appendArchwayTopPanel(positions, indices, centerX, springZ, innerRadius, topZ, thickness, segments) {
  const y0 = -CELL_SIZE_MM / 2;
  const y1 = y0 + thickness;
  const boundary = archwayBottomBoundary(centerX, springZ, innerRadius, segments);
  const stripCount = boundary.length - 1;
  for (let index = 0; index < stripCount; index += 1) {
    const lower0 = boundary[index];
    const lower1 = boundary[index + 1];
    const top0 = [lower0[0], topZ];
    const top1 = [lower1[0], topZ];
    const l0f = [lower0[0], y0, lower0[1]];
    const l1f = [lower1[0], y0, lower1[1]];
    const t1f = [top1[0], y0, top1[1]];
    const t0f = [top0[0], y0, top0[1]];
    const l0b = [lower0[0], y1, lower0[1]];
    const l1b = [lower1[0], y1, lower1[1]];
    const t1b = [top1[0], y1, top1[1]];
    const t0b = [top0[0], y1, top0[1]];
    for (const face of [
      [l0f, l1f, t1f, t0f],
      [l0b, t0b, t1b, l1b],
      [t0f, t1f, t1b, t0b]
    ]) {
      appendFace(positions, indices, ...face);
    }
    if (index > 0 && index <= segments) {
      appendFace(positions, indices, l0f, l0b, l1b, l1f);
    }
  }
  const leftLower = boundary[0];
  const leftTop = [leftLower[0], topZ];
  const rightLower = boundary[stripCount];
  const rightTop = [rightLower[0], topZ];
  appendFace(
    positions,
    indices,
    [leftLower[0], y0, leftLower[1]],
    [leftTop[0], y0, leftTop[1]],
    [leftTop[0], y1, leftTop[1]],
    [leftLower[0], y1, leftLower[1]]
  );
  appendFace(
    positions,
    indices,
    [rightLower[0], y0, rightLower[1]],
    [rightLower[0], y1, rightLower[1]],
    [rightTop[0], y1, rightTop[1]],
    [rightTop[0], y0, rightTop[1]]
  );
}

function archwayBottomBoundary(centerX, springZ, innerRadius, segments) {
  const boundary = [[-CELL_SIZE_MM / 2, springZ]];
  for (let index = 0; index <= segments; index += 1) {
    const angle = Math.PI - (index * Math.PI) / segments;
    boundary.push([
      centerX + Math.cos(angle) * innerRadius,
      springZ + Math.sin(angle) * innerRadius
    ]);
  }
  boundary.push([CELL_SIZE_MM / 2, springZ]);
  return boundary;
}

function bufferGeometry(positions, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createGridColumnGeometry(xSpans, ySpans, occupied, height) {
  const s = CELL_SIZE_MM;
  const positions = [];
  const indices = [];
  const z0 = -s / 2;
  const z1 = z0 + height;
  for (let xi = 0; xi < xSpans.length - 1; xi += 1) {
    for (let yi = 0; yi < ySpans.length - 1; yi += 1) {
      if (!occupied[xi][yi]) continue;
      const x0 = -s / 2 + xSpans[xi];
      const x1 = -s / 2 + xSpans[xi + 1];
      const y0 = -s / 2 + ySpans[yi];
      const y1 = -s / 2 + ySpans[yi + 1];
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
      appendFace(positions, indices, vertices.p000, vertices.p100, vertices.p110, vertices.p010);
      appendFace(positions, indices, vertices.p001, vertices.p011, vertices.p111, vertices.p101);
      if (!occupied[xi - 1]?.[yi]) appendFace(positions, indices, vertices.p000, vertices.p010, vertices.p011, vertices.p001);
      if (!occupied[xi + 1]?.[yi]) appendFace(positions, indices, vertices.p100, vertices.p101, vertices.p111, vertices.p110);
      if (!occupied[xi]?.[yi - 1]) appendFace(positions, indices, vertices.p000, vertices.p001, vertices.p101, vertices.p100);
      if (!occupied[xi]?.[yi + 1]) appendFace(positions, indices, vertices.p110, vertices.p111, vertices.p011, vertices.p010);
    }
  }
  return bufferGeometry(positions, indices);
}

function createMaterialTexture(material, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const base = MATERIALS[material]?.color || "#b84b3f";
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  const rng = seededRandom(seed || material);

  if (material === "brick") {
    context.strokeStyle = "#7f2f29";
    context.lineWidth = 6;
    for (const y of [38, 80]) line(context, 0, y, 128, y);
    for (const [x, y1, y2] of [[64, 0, 38], [26, 38, 80], [88, 38, 80], [64, 80, 128]]) line(context, x, y1, x, y2);
    context.strokeStyle = "#ef9c91";
    context.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) line(context, 12 + rng() * 90, 16 + rng() * 92, 28 + rng() * 90, 16 + rng() * 92);
  } else if (material === "rubble_stone") {
    context.fillStyle = "#575345";
    context.fillRect(0, 0, 128, 128);
    const rows = [0, 26, 52, 82, 108, 128];
    for (let row = 0; row < rows.length - 1; row += 1) {
      let x = row % 2 === 0 ? -18 : 0;
      while (x < 128) {
        const width = 22 + rng() * 36;
        const y0 = rows[row] + 3 + rng() * 4;
        const y1 = rows[row + 1] - 3 - rng() * 4;
        const x0 = Math.max(0, x + 3 + rng() * 4);
        const x1 = Math.min(128, x + width - 3 - rng() * 4);
        if (x1 - x0 > 12 && y1 - y0 > 10) {
          const shade = 132 + Math.floor(rng() * 34);
          context.fillStyle = `rgb(${shade}, ${shade - 6}, ${shade - 24})`;
          context.beginPath();
          context.roundRect(x0, y0, x1 - x0, y1 - y0, 5 + rng() * 7);
          context.fill();
          context.strokeStyle = "rgba(235, 229, 198, 0.3)";
          context.lineWidth = 2;
          context.stroke();
        }
        x += width;
      }
    }
    context.strokeStyle = "rgba(44, 39, 31, 0.45)";
    context.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      line(context, rng() * 128, rng() * 128, rng() * 128, rng() * 128);
    }
  } else if (material === "roof_tile") {
    context.fillStyle = "#6f2d25";
    context.fillRect(0, 0, 128, 128);
    for (let row = -1; row < 8; row += 1) {
      const y = row * 18 + 7;
      const offset = row % 2 === 0 ? -18 : 0;
      for (let x = offset; x < 128; x += 34) {
        const shade = 130 + Math.floor(rng() * 34);
        context.fillStyle = `rgb(${shade}, ${Math.max(45, shade - 54)}, ${Math.max(38, shade - 68)})`;
        context.beginPath();
        context.roundRect(x + 2, y, 30, 15, 5);
        context.fill();
        context.strokeStyle = "rgba(70, 20, 16, 0.7)";
        context.lineWidth = 3;
        context.stroke();
      }
      context.strokeStyle = "#3f1714";
      context.lineWidth = 4;
      line(context, 0, y + 15, 128, y + 15);
    }
    context.strokeStyle = "rgba(240, 151, 117, 0.55)";
    context.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) line(context, rng() * 128, rng() * 128, rng() * 128, rng() * 128);
  } else if (material === "metal_plate") {
    context.fillStyle = "#70787d";
    context.fillRect(0, 0, 128, 128);
    context.strokeStyle = "#3e474c";
    context.lineWidth = 5;
    context.strokeRect(10, 10, 108, 108);
    line(context, 64, 10, 64, 118);
    context.fillStyle = "#aeb6ba";
    for (const [x, y] of [[22, 22], [106, 22], [22, 106], [106, 106], [64, 64]]) {
      context.beginPath();
      context.arc(x, y, 6, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#4c555a";
      context.lineWidth = 2;
      context.stroke();
    }
    context.strokeStyle = "rgba(232, 238, 240, 0.35)";
    context.lineWidth = 2;
    for (let i = 0; i < 8; i += 1) line(context, rng() * 128, rng() * 128, rng() * 128, rng() * 128);
  } else if (material === "grid_tile") {
    context.fillStyle = "#eef3f4";
    context.fillRect(0, 0, 128, 128);
    context.strokeStyle = "#889aa0";
    context.lineWidth = 5;
    for (const value of [32, 64, 96]) {
      line(context, value, 0, value, 128);
      line(context, 0, value, 128, value);
    }
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    for (const value of [16, 48, 80, 112]) {
      line(context, value - 8, value, value + 8, value);
    }
  } else {
    context.strokeStyle = "#aeb4ae";
    context.lineWidth = 4;
    context.strokeRect(10, 10, 108, 108);
    context.strokeStyle = "#eef0ec";
    context.lineWidth = 2;
    context.strokeRect(18, 18, 92, 92);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function updateCursorMesh() {
  const heightCells = currentShapeHeightCells();
  cursorMesh.scale.set(1, 1, heightCells);
  cursorMesh.position.set(
    state.cursor.x * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    state.cursor.y * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    state.cursor.z * CELL_SIZE_MM + (heightCells * CELL_SIZE_MM) / 2
  );
}

function tick() {
  resizeRenderer();
  updateHeldCameraControls();
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function resizeRenderer() {
  const { clientWidth, clientHeight } = elements.canvas;
  const width = Math.max(1, clientWidth);
  const height = Math.max(1, clientHeight);
  if (elements.canvas.width !== Math.floor(width * window.devicePixelRatio)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function updateCamera() {
  const center = new THREE.Vector3(
    (state.project.workspaceCells.x * CELL_SIZE_MM) / 2 + state.cameraPan.x,
    (state.project.workspaceCells.y * CELL_SIZE_MM) / 2 + state.cameraPan.y,
    Math.max(120, (state.project.workspaceCells.z * CELL_SIZE_MM) / 2) + state.cameraLift
  );
  const distance = Math.max(
    520,
    Math.max(state.project.workspaceCells.x, state.project.workspaceCells.y, state.project.workspaceCells.z) * CELL_SIZE_MM * 0.95
  );
  camera.position.set(
    center.x + Math.cos(state.cameraAngle) * distance,
    center.y + Math.sin(state.cameraAngle) * distance,
    center.z + distance * state.cameraPitch
  );
  camera.up.set(0, 0, 1);
  camera.lookAt(center);
}

function placeOrSelectAtCursor() {
  const existing = getBlock(state.project, state.cursor);
  if (existing) {
    state.selected = { x: existing.x, y: existing.y, z: existing.z };
    state.selectedMaterial = existing.material;
    state.selectedShape = existing.shape;
    updateUi();
    renderProject();
    return;
  }
  const block = makeBlock({
    ...state.cursor,
    shape: state.selectedShape,
    material: state.selectedMaterial,
    rotation: state.pendingRotation
  });
  const result = setBlock(state.project, block);
  if (!result.ok) {
    setWarning(result.reason);
    return;
  }
  commitProject(result.project);
  state.selected = { x: block.x, y: block.y, z: block.z };
  setWarning("");
}

function handleViewportClick(event) {
  if (state.suppressNextClick) {
    state.suppressNextClick = false;
    return;
  }
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(blockGroup.children, false);
  if (intersections.length > 0) {
    const hit = intersections[0];
    const hitPosition = hit.object.userData.position;
    if (state.mouseMode === "select" || event.shiftKey) {
      if (hitPosition) selectBlock(hitPosition);
      return;
    }
    const next = positionAdjacentToHitFace(hit);
    if (next && !getBlock(state.project, next)) {
      state.cursor = next;
      updateCursorMesh();
      placeOrSelectAtCursor();
      return;
    }
    if (hitPosition) {
      selectBlock(hitPosition);
      return;
    }
  }
  if (projectPointerToCursor()) {
    placeOrSelectAtCursor();
  }
}

function handleViewportPointerDown(event) {
  if (event.button !== 0 || isTouchControlTarget(event.target)) return;
  if (event.pointerType === "touch") {
    state.touchPointers.set(event.pointerId, pointerSnapshot(event));
    captureViewportPointer(event.pointerId);
    if (state.touchPointers.size >= 2) {
      cancelTouchLongPressDelete();
      beginViewportGesture();
      event.preventDefault();
      return;
    }
    startTouchLongPressDelete(event);
  }
  state.viewportDrag = {
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    moved: false
  };
  captureViewportPointer(event.pointerId);
}

function handleViewportPointerUp(event) {
  const longPressDeleted = finishTouchLongPressDelete(event.pointerId);
  if (longPressDeleted) {
    if (event.pointerType === "touch") state.touchPointers.delete(event.pointerId);
    releaseViewportPointer(event.pointerId);
    state.viewportDrag = null;
    state.suppressNextClick = true;
    event.preventDefault();
    return;
  }
  if (event.pointerType === "touch" && state.touchPointers.has(event.pointerId)) {
    state.touchPointers.delete(event.pointerId);
    releaseViewportPointer(event.pointerId);
    if (state.viewportGesture || state.touchPointers.size > 0) {
      state.viewportGesture = null;
      state.viewportDrag = null;
      state.suppressNextClick = true;
      event.preventDefault();
      return;
    }
  }
  const drag = state.viewportDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  releaseViewportPointer(event.pointerId);
  state.viewportDrag = null;
  if (drag.moved) {
    state.suppressNextClick = true;
    return;
  }
  if (drag.pointerType !== "mouse") {
    handleViewportClick(event);
    state.suppressNextClick = true;
  }
}

function handleViewportPointerCancel(event) {
  cancelTouchLongPressDelete(event.pointerId);
  if (event.pointerType === "touch" && state.touchPointers.has(event.pointerId)) {
    state.touchPointers.delete(event.pointerId);
    state.viewportGesture = null;
  }
  if (state.viewportDrag?.pointerId === event.pointerId) {
    state.viewportDrag = null;
  }
}

function handlePointerMove(event) {
  if (updateViewportGesture(event)) return;
  if (updateViewportDrag(event)) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(blockGroup.children, false);
  if (intersections.length > 0) {
    const next = positionAdjacentToHitFace(intersections[0]);
    if (next) {
      state.cursor = next;
      updateCursorMesh();
      updateUi();
      return;
    }
  }
  if (projectPointerToCursor()) {
    updateCursorMesh();
    updateUi();
  }
}

function updateViewportDrag(event) {
  const drag = state.viewportDrag;
  if (!drag || drag.pointerId !== event.pointerId) return false;
  const totalX = event.clientX - drag.startX;
  const totalY = event.clientY - drag.startY;
  const movement = Math.hypot(totalX, totalY);
  if (movement >= TOUCH_LONG_PRESS_MOVE_PX) cancelTouchLongPressDelete(event.pointerId);
  if (!drag.moved && movement < VIEW_DRAG_THRESHOLD_PX) return false;
  cancelTouchLongPressDelete(event.pointerId);
  drag.moved = true;
  const deltaX = event.clientX - drag.lastX;
  const deltaY = event.clientY - drag.lastY;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  state.cameraAngle -= deltaX * VIEW_DRAG_YAW_SPEED;
  state.cameraPitch = clamp(state.cameraPitch - deltaY * VIEW_DRAG_PITCH_SPEED, 0.22, 1.4);
  event.preventDefault();
  return true;
}

function updateViewportGesture(event) {
  if (event.pointerType !== "touch" || !state.touchPointers.has(event.pointerId)) return false;
  state.touchPointers.set(event.pointerId, pointerSnapshot(event));
  if (state.touchPointers.size < 2) return false;
  if (!state.viewportGesture) beginViewportGesture();
  const snapshot = touchGestureSnapshot();
  const gesture = state.viewportGesture;
  if (!snapshot || !gesture) return false;
  if (snapshot.distance > 1 && gesture.lastDistance > 1) {
    camera.zoom = clamp(camera.zoom * (snapshot.distance / gesture.lastDistance), 0.45, 2.4);
    camera.updateProjectionMatrix();
  }
  gesture.lastMidpoint = snapshot.midpoint;
  gesture.lastDistance = snapshot.distance;
  state.viewportDrag = null;
  state.suppressNextClick = true;
  event.preventDefault();
  return true;
}

function beginViewportGesture() {
  const snapshot = touchGestureSnapshot();
  if (!snapshot) return;
  state.viewportGesture = {
    lastMidpoint: snapshot.midpoint,
    lastDistance: snapshot.distance
  };
  state.viewportDrag = null;
  state.suppressNextClick = true;
}

function touchGestureSnapshot() {
  const pointers = Array.from(state.touchPointers.values()).slice(0, 2);
  if (pointers.length < 2) return null;
  const [a, b] = pointers;
  return {
    midpoint: {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    },
    distance: Math.hypot(a.x - b.x, a.y - b.y)
  };
}

function pointerSnapshot(event) {
  return {
    x: event.clientX,
    y: event.clientY
  };
}

function startTouchLongPressDelete(event) {
  const position = blockPositionFromPointerEvent(event);
  if (!position) return;
  cancelTouchLongPressDelete();
  const press = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    position,
    fired: false,
    timer: null
  };
  press.timer = window.setTimeout(() => {
    const current = state.touchLongPressDelete;
    if (!current || current.pointerId !== event.pointerId) return;
    current.fired = true;
    state.suppressNextClick = true;
    state.viewportDrag = null;
    eraseBlockAt(current.position, "已挖掉方塊。");
  }, TOUCH_LONG_PRESS_DELETE_MS);
  state.touchLongPressDelete = press;
}

function finishTouchLongPressDelete(pointerId) {
  const press = state.touchLongPressDelete;
  if (!press || press.pointerId !== pointerId) return false;
  window.clearTimeout(press.timer);
  state.touchLongPressDelete = null;
  return press.fired;
}

function cancelTouchLongPressDelete(pointerId = null) {
  const press = state.touchLongPressDelete;
  if (!press || (pointerId !== null && press.pointerId !== pointerId)) return;
  window.clearTimeout(press.timer);
  state.touchLongPressDelete = null;
}

function blockPositionFromPointerEvent(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(blockGroup.children, false);
  const hit = intersections.find((intersection) => intersection.object.userData.position);
  return hit?.object.userData.position ? { ...hit.object.userData.position } : null;
}

function captureViewportPointer(pointerId) {
  try {
    elements.canvas.setPointerCapture?.(pointerId);
  } catch {
    // Synthetic pointer events in smoke tests do not always have an active browser pointer.
  }
}

function releaseViewportPointer(pointerId) {
  try {
    elements.canvas.releasePointerCapture?.(pointerId);
  } catch {
    // The pointer may already be released after a touch gesture ends.
  }
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  if (event.metaKey || event.ctrlKey) {
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      return undo();
    }
    if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      return redo();
    }
    if (key === "c") return copySelected();
    if (key === "v") return pasteCopied();
    if (key === "s") {
      event.preventDefault();
      return saveProject(false);
    }
    if (key === "o") {
      event.preventDefault();
      return openProject();
    }
    return;
  }
  if (isTextInputTarget(event.target)) return;
  if (["w", "a", "s", "d", "q", "e", "t", "f", "g", "h"].includes(key)) {
    state.pressedKeys.add(key);
  }
  if (event.key === "ArrowLeft") moveCursor(-1, 0, 0);
  if (event.key === "ArrowRight") moveCursor(1, 0, 0);
  if (event.key === "ArrowUp") moveCursor(0, 1, 0);
  if (event.key === "ArrowDown") moveCursor(0, -1, 0);
  if (event.key === "PageUp") moveCursor(0, 0, 1);
  if (event.key === "PageDown") moveCursor(0, 0, -1);
  if (key === "r") rotateSelectedOrPending();
  if (event.key === "Delete" || event.key === "Backspace") eraseSelected();
}

function handleKeyup(event) {
  state.pressedKeys.delete(event.key.toLowerCase());
}

function handleWheel(event) {
  camera.zoom = THREE.MathUtils.clamp(camera.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 0.45, 2.4);
  camera.updateProjectionMatrix();
}

function moveCursor(dx, dy, dz) {
  state.cursor.x = clamp(state.cursor.x + dx, 0, state.project.workspaceCells.x - 1);
  state.cursor.y = clamp(state.cursor.y + dy, 0, state.project.workspaceCells.y - 1);
  state.cursor.z = clamp(state.cursor.z + dz, 0, maxCursorZ());
  updateCursorMesh();
  updateUi();
}

function moveCursorByView(direction) {
  if (direction === "up") return moveCursor(0, 0, 1);
  if (direction === "down") return moveCursor(0, 0, -1);
  const delta = screenRelativeCursorDelta(direction);
  moveCursor(delta.x, delta.y, 0);
}

function screenRelativeCursorDelta(direction) {
  updateCamera();
  camera.updateMatrixWorld();
  const desired = {
    forward: { x: 0, y: 1 },
    back: { x: 0, y: -1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  }[direction] || { x: 0, y: 1 };
  const origin = projectedCellCenter(state.cursor);
  const candidates = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  let best = null;
  let bestScore = -Infinity;
  for (const delta of candidates) {
    const position = {
      x: state.cursor.x + delta.x,
      y: state.cursor.y + delta.y,
      z: state.cursor.z
    };
    if (
      position.x < 0
      || position.x >= state.project.workspaceCells.x
      || position.y < 0
      || position.y >= state.project.workspaceCells.y
    ) continue;
    const projected = projectedCellCenter(position);
    const screenDelta = {
      x: projected.x - origin.x,
      y: projected.y - origin.y
    };
    const length = Math.hypot(screenDelta.x, screenDelta.y);
    if (length < 0.0001) continue;
    const score = ((screenDelta.x / length) * desired.x) + ((screenDelta.y / length) * desired.y);
    if (score > bestScore) {
      bestScore = score;
      best = delta;
    }
  }
  return best || angleRelativeCursorDelta(direction);
}

function angleRelativeCursorDelta(direction) {
  const viewForward = {
    x: -Math.cos(state.cameraAngle),
    y: -Math.sin(state.cameraAngle)
  };
  const viewRight = {
    x: -Math.sin(state.cameraAngle),
    y: Math.cos(state.cameraAngle)
  };
  const vector = direction === "back"
    ? { x: -viewForward.x, y: -viewForward.y }
    : direction === "right"
      ? viewRight
      : direction === "left"
        ? { x: -viewRight.x, y: -viewRight.y }
        : viewForward;
  if (Math.abs(vector.x) >= Math.abs(vector.y)) return { x: Math.sign(vector.x), y: 0 };
  return { x: 0, y: Math.sign(vector.y) };
}

function projectedCellCenter(position) {
  const vector = new THREE.Vector3(
    (position.x + 0.5) * CELL_SIZE_MM,
    (position.y + 0.5) * CELL_SIZE_MM,
    (position.z + 0.5) * CELL_SIZE_MM
  );
  vector.project(camera);
  return { x: vector.x, y: vector.y };
}

function bindRepeatingTouchButton(button, action) {
  button.addEventListener("pointerdown", (event) => startRepeatingTouchButton(event, action));
  button.addEventListener("pointerup", stopRepeatingTouchButton);
  button.addEventListener("pointercancel", stopRepeatingTouchButton);
  button.addEventListener("lostpointercapture", stopRepeatingTouchButton);
  button.addEventListener("click", (event) => handleRepeatingTouchButtonClick(event, action));
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

function startRepeatingTouchButton(event, action) {
  if (event.button !== 0) return;
  event.preventDefault();
  stopRepeatingTouchButton();
  action();
  const repeat = {
    pointerId: event.pointerId,
    target: event.currentTarget,
    timeout: null,
    interval: null
  };
  repeat.timeout = window.setTimeout(() => {
    action();
    repeat.interval = window.setInterval(action, TOUCH_BUTTON_REPEAT_INTERVAL_MS);
  }, TOUCH_BUTTON_REPEAT_DELAY_MS);
  state.touchButtonRepeat = repeat;
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } catch {
    // Synthetic events in smoke checks may not have an active pointer to capture.
  }
}

function stopRepeatingTouchButton(event = null) {
  const repeat = state.touchButtonRepeat;
  if (!repeat || (event?.pointerId !== undefined && event.pointerId !== repeat.pointerId)) return;
  window.clearTimeout(repeat.timeout);
  window.clearInterval(repeat.interval);
  try {
    repeat.target.releasePointerCapture?.(repeat.pointerId);
  } catch {
    // The pointer may already be released.
  }
  state.touchButtonRepeat = null;
  state.suppressTouchButtonClickUntil = performance.now() + 360;
}

function handleRepeatingTouchButtonClick(event, action) {
  event.preventDefault();
  if (performance.now() < state.suppressTouchButtonClickUntil) return;
  action();
}

function panTouchView(direction) {
  panCameraByView({
    right: (direction === "right" ? 1 : 0) - (direction === "left" ? 1 : 0),
    forward: (direction === "forward" ? 1 : 0) - (direction === "back" ? 1 : 0),
    step: TOUCH_VIEW_PAN_STEP_MM
  });
}

function handleTouchCommandButton(event) {
  event.preventDefault();
  const command = event.currentTarget.dataset.touchCommand;
  if (command === "place") return placeOrSelectAtCursor();
  if (command === "rotate") return rotateSelectedOrPending();
  if (command === "erase") return eraseSelected();
}

function rotateCamera(delta) {
  state.cameraAngle += delta;
}

function setMouseMode(mode) {
  state.mouseMode = mode;
  updateUi();
}

function updateHeldCameraControls() {
  const yawStep = 0.035;
  const pitchStep = 0.018;
  const liftStep = CELL_SIZE_MM * 0.22;
  const panStep = CELL_SIZE_MM * 0.18;
  if (state.pressedKeys.has("a")) state.cameraAngle -= yawStep;
  if (state.pressedKeys.has("d")) state.cameraAngle += yawStep;
  if (state.pressedKeys.has("w")) state.cameraPitch = clamp(state.cameraPitch + pitchStep, 0.22, 1.4);
  if (state.pressedKeys.has("s")) state.cameraPitch = clamp(state.cameraPitch - pitchStep, 0.22, 1.4);
  if (state.pressedKeys.has("q")) state.cameraLift = clamp(state.cameraLift - liftStep, -1200, 1200);
  if (state.pressedKeys.has("e")) state.cameraLift = clamp(state.cameraLift + liftStep, -1200, 1200);
  panCameraByView({
    right: (state.pressedKeys.has("h") ? 1 : 0) - (state.pressedKeys.has("f") ? 1 : 0),
    forward: (state.pressedKeys.has("t") ? 1 : 0) - (state.pressedKeys.has("g") ? 1 : 0),
    step: panStep
  });
}

function panCameraByView({ right, forward, step }) {
  if (!right && !forward) return;
  const viewForward = {
    x: -Math.cos(state.cameraAngle),
    y: -Math.sin(state.cameraAngle)
  };
  const viewRight = {
    x: -Math.sin(state.cameraAngle),
    y: Math.cos(state.cameraAngle)
  };
  state.cameraPan.x = clamp(
    state.cameraPan.x + ((viewRight.x * right) + (viewForward.x * forward)) * step,
    -3000,
    3000
  );
  state.cameraPan.y = clamp(
    state.cameraPan.y + ((viewRight.y * right) + (viewForward.y * forward)) * step,
    -3000,
    3000
  );
}

function updatePointer(event) {
  const rect = elements.canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function projectPointerToCursor() {
  raycaster.setFromCamera(pointer, camera);
  const z = state.cursor.z * CELL_SIZE_MM;
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) return false;
  const next = {
    x: clamp(Math.floor(hit.x / CELL_SIZE_MM), 0, state.project.workspaceCells.x - 1),
    y: clamp(Math.floor(hit.y / CELL_SIZE_MM), 0, state.project.workspaceCells.y - 1),
    z: clamp(state.cursor.z, 0, maxCursorZ())
  };
  state.cursor = next;
  return true;
}

function positionAdjacentToHitFace(intersection) {
  const position = intersection.object.userData.position;
  if (!position || !intersection.face) return null;
  const normal = intersection.face.normal.clone().transformDirection(intersection.object.matrixWorld);
  const axis = dominantAxis(normal);
  const next = { ...position };
  next[axis.name] += axis.sign;
  if (!isInsideWorkspace(next)) return null;
  return next;
}

function dominantAxis(vector) {
  const axes = [
    { name: "x", value: vector.x },
    { name: "y", value: vector.y },
    { name: "z", value: vector.z }
  ];
  const axis = axes.reduce((best, candidate) => Math.abs(candidate.value) > Math.abs(best.value) ? candidate : best);
  return { name: axis.name, sign: axis.value >= 0 ? 1 : -1 };
}

function selectBlock(position) {
  const block = getBlock(state.project, position);
  if (!block) return;
  state.selected = { ...position };
  state.selectedMaterial = block.material;
  state.selectedShape = block.shape;
  state.cursor = { ...position };
  updateCursorMesh();
  updateUi();
  renderProject();
}

function changeActiveMaterial() {
  state.selectedMaterial = elements.materialList.value;
  updateUi();
}

function selectTouchMaterial(materialId) {
  state.selectedMaterial = materialId;
  const selectedBlock = state.selected ? getBlock(state.project, state.selected) : null;
  if (selectedBlock) {
    const result = changeBlockMaterial(state.project, state.selected, materialId);
    if (result.ok) {
      commitProject(result.project);
      return;
    }
    setWarning(result.reason);
    return;
  }
  updateUi();
}

function changeActiveShape() {
  state.selectedShape = elements.shapeList.value;
  clampCursorToSelectedShape();
  updateUi();
}

function clampCursorToSelectedShape() {
  state.cursor.z = clamp(state.cursor.z, 0, maxCursorZ());
  updateCursorMesh();
}

function maxCursorZ() {
  return Math.max(0, state.project.workspaceCells.z - currentShapeHeightCells());
}

function currentShapeHeightCells() {
  return SHAPES[state.selectedShape]?.heightCells || 1;
}

function commitProject(project) {
  state.project = state.history.commit(project);
  updateWorkspaceInputs();
  renderProject();
  updateUi();
}

function undo() {
  state.project = state.history.undo();
  renderProject();
  updateUi();
}

function redo() {
  state.project = state.history.redo();
  renderProject();
  updateUi();
}

function copySelected() {
  const block = state.selected ? getBlock(state.project, state.selected) : getBlock(state.project, state.cursor);
  state.copied = copyBlock(block);
  setWarning(state.copied ? "已複製方塊與固定紋理。" : "沒有可複製的方塊。");
}

function pasteCopied() {
  const result = pasteBlock(state.project, state.copied, state.cursor);
  if (!result.ok) return setWarning(result.reason);
  commitProject(result.project);
  state.selected = { ...state.cursor };
  setWarning("已貼上方塊。");
}

function eraseSelected() {
  const target = state.selected || state.cursor;
  if (!getBlock(state.project, target)) return setWarning("沒有可清除的方塊。");
  if (!confirm("確定要清除這個方塊嗎？可用復原救回。")) return;
  eraseBlockAt(target, "已清除方塊。");
}

function eraseBlockAt(target, message) {
  const block = getBlock(state.project, target);
  if (!block) return setWarning("沒有可清除的方塊。");
  const result = removeBlock(state.project, target);
  if (result.ok) {
    state.selected = null;
    commitProject(result.project);
    setWarning(message);
    return;
  }
  setWarning(result.reason);
}

function rotateSelectedOrPending() {
  if (!state.selected) {
    state.pendingRotation = (state.pendingRotation + 90) % 360;
    updateUi();
    return;
  }
  const result = rotateBlock(state.project, state.selected, 90);
  if (!result.ok) return setWarning(result.reason);
  commitProject(result.project);
}

function changeSelectedMaterial() {
  const material = elements.selectedMaterial.value;
  state.selectedMaterial = material;
  if (!state.selected) return updateUi();
  const result = changeBlockMaterial(state.project, state.selected, material);
  if (!result.ok) return setWarning(result.reason);
  commitProject(result.project);
}

function alignCurrentMaterial() {
  const material = state.selectedMaterial;
  if (!confirm("整理材質方向可能改變紋理方向或隨機排列外觀。要繼續嗎？")) return;
  const result = alignMaterialOrientation(state.project, material);
  if (result.ok) {
    commitProject(result.project);
    setWarning("已整理相同材質方向。");
  }
}

function applyWorkspace() {
  applyWorkspaceFromInputs(elements.workspaceX, elements.workspaceY, elements.workspaceZ);
}

function applyTouchWorkspace() {
  applyWorkspaceFromInputs(elements.touchWorkspaceX, elements.touchWorkspaceY, elements.touchWorkspaceZ);
  elements.touchWorkspacePanel.hidden = true;
}

function applyWorkspaceFromInputs(inputX, inputY, inputZ) {
  const result = resizeWorkspace(state.project, {
    x: Number(inputX.value),
    y: Number(inputY.value),
    z: Number(inputZ.value)
  });
  if (!result.ok) {
    updateWorkspaceInputs();
    return setWarning(result.reason);
  }
  commitProject(result.project);
}

function toggleTouchWorkspacePanel() {
  elements.touchWorkspacePanel.hidden = !elements.touchWorkspacePanel.hidden;
  if (!elements.touchWorkspacePanel.hidden) updateWorkspaceInputs();
}

function newProject() {
  if (!confirm("建立新專案會清空目前畫面。確定嗎？")) return;
  loadProject(createProject(), null);
}

async function openProject() {
  const result = await window.model3d.openProject();
  if (result.canceled) return;
  const project = normalizeProject(JSON.parse(result.content));
  loadProject(project, result.filePath);
}

async function saveProject(isAutosave) {
  const content = JSON.stringify(state.project, null, 2);
  if (isAutosave) {
    localStorage.setItem("model3d.autosave", content);
    localStorage.setItem("model3d.autosaveAt", String(Date.now()));
    localStorage.setItem("model3d.lastExplicitSaveAt", String(state.lastExplicitSaveAt || 0));
    state.lastAutosaveAt = Date.now();
    updateUi();
    return;
  }
  const result = await window.model3d.saveProject({
    suggestedName: getProjectFileName(state.project.name),
    content,
    filePath: state.filePath
  });
  if (!result.canceled) {
    state.filePath = result.filePath;
    state.lastExplicitSaveAt = Date.now();
    localStorage.setItem("model3d.lastExplicitSaveAt", String(state.lastExplicitSaveAt));
    setWarning("專案已儲存。");
  }
}

function autosave() {
  saveProject(true);
}

function loadAutosavePrompt() {
  const autosaveContent = localStorage.getItem("model3d.autosave");
  const autosaveAt = Number(localStorage.getItem("model3d.autosaveAt") || 0);
  const explicitAt = Number(localStorage.getItem("model3d.lastExplicitSaveAt") || 0);
  if (!autosaveContent || autosaveAt <= explicitAt) return;
  elements.recoverDialog.showModal();
  elements.recoverDialog.addEventListener(
    "close",
    () => {
      if (elements.recoverDialog.returnValue === "recover") {
        loadProject(normalizeProject(JSON.parse(autosaveContent)), null);
        setWarning("已復原自動儲存。");
      }
    },
    { once: true }
  );
}

function loadProject(project, filePath) {
  state.project = project;
  state.filePath = filePath;
  state.history = new ProjectHistory(project);
  state.selected = null;
  state.cursor = { x: 0, y: 0, z: 0 };
  updateWorkspaceInputs();
  renderProject();
  updateUi();
}

async function exportStl() {
  elements.exportState.textContent = "產生幾何與修復 mesh...";
  elements.exportState.className = "export-state";
  const result = exportAsciiStl(state.project, state.project.name);
  if (!result.ok) {
    elements.exportState.textContent = `輸出阻擋：${result.reason}`;
    elements.exportState.className = "export-state blocked";
    return;
  }
  const saved = await window.model3d.exportStl({
    suggestedName: `${state.project.name || "model"}.stl`,
    content: result.stl
  });
  if (!saved.canceled) {
    elements.exportState.textContent = `已輸出 ${result.triangleCount} 個三角面：${saved.filePath}`;
    elements.exportState.className = "export-state ready";
  }
}

function updateWorkspaceInputs() {
  elements.workspaceX.value = state.project.workspaceCells.x;
  elements.workspaceY.value = state.project.workspaceCells.y;
  elements.workspaceZ.value = state.project.workspaceCells.z;
  elements.touchWorkspaceX.value = state.project.workspaceCells.x;
  elements.touchWorkspaceY.value = state.project.workspaceCells.y;
  elements.touchWorkspaceZ.value = state.project.workspaceCells.z;
}

function updateUi() {
  document.querySelectorAll("[data-material]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.material === state.selectedMaterial);
  });
  document.querySelectorAll("[data-shape]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.shape === state.selectedShape);
  });
  elements.placeMode.classList.toggle("active", state.mouseMode === "place");
  elements.selectMode.classList.toggle("active", state.mouseMode === "select");
  const selectedBlock = state.selected ? getBlock(state.project, state.selected) : null;
  elements.selectionInfo.textContent = selectedBlock
    ? `${MATERIALS[selectedBlock.material].label} / ${SHAPES[selectedBlock.shape].label} / ${selectedBlock.x},${selectedBlock.y},${selectedBlock.z}`
    : "尚未選取";
  elements.selectedMaterial.value = selectedBlock?.material || state.selectedMaterial;
  elements.materialList.value = state.selectedMaterial;
  elements.shapeList.value = state.selectedShape;
  elements.blockCount.textContent = `方塊 ${state.project.blocks.length} / ${MAX_BLOCKS}`;
  elements.cursorState.textContent = `游標：${state.cursor.x}, ${state.cursor.y}, ${state.cursor.z}`;
  elements.modeState.textContent = `滑鼠：${state.mouseMode === "select" ? "選取" : "放置"}　材質：${MATERIALS[state.selectedMaterial].label}　形狀：${SHAPES[state.selectedShape].label}　旋轉：${state.pendingRotation}°`;
  elements.warningState.textContent = state.warning;
  elements.autosaveState.textContent = state.lastAutosaveAt
    ? `上次自動儲存：${new Date(state.lastAutosaveAt).toLocaleTimeString("zh-TW")}`
    : "尚未自動儲存";
}

function setWarning(message) {
  state.warning = message || "";
  updateUi();
}

function samePosition(a, b) {
  return a && b && a.x === b.x && a.y === b.y && a.z === b.z;
}

function isTextInputTarget(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLTextAreaElement
    || target?.isContentEditable;
}

function isTouchControlTarget(target) {
  return Boolean(target?.closest?.(".touch-hud"));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isInsideWorkspace(position) {
  return position.x >= 0
    && position.y >= 0
    && position.z >= 0
    && position.x < state.project.workspaceCells.x
    && position.y < state.project.workspaceCells.y
    && position.z < state.project.workspaceCells.z;
}

function seededRandom(seedText) {
  let seed = 0;
  for (const char of String(seedText)) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
}

function line(context, x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}
