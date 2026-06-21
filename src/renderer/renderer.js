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

const ASSET = "../../assets";
const EXAMPLES = [
  { label: "小房子", path: `${ASSET}/examples/small_house.m3dp` },
  { label: "石橋", path: `${ASSET}/examples/stone_bridge.m3dp` },
  { label: "教室牌", path: `${ASSET}/examples/classroom_sign.m3dp` },
  { label: "城牆", path: `${ASSET}/examples/tower_wall.m3dp` }
];

const state = {
  project: createProject(),
  history: null,
  filePath: null,
  selectedMaterial: "brick",
  selectedShape: "cube",
  selected: null,
  copied: null,
  cursor: { x: 0, y: 0, z: 0 },
  pendingRotation: 0,
  lastExplicitSaveAt: 0,
  lastAutosaveAt: 0,
  cameraAngle: Math.PI / 4,
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
scene.add(new THREE.AmbientLight("#ffffff", 0.7));
const sun = new THREE.DirectionalLight("#ffffff", 1.1);
sun.position.set(500, -800, 1200);
scene.add(sun);

const cursorMaterial = new THREE.MeshBasicMaterial({
  color: "#16746d",
  transparent: true,
  opacity: 0.22,
  depthWrite: false
});
const cursorMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE_MM, CELL_SIZE_MM, CELL_SIZE_MM), cursorMaterial);
scene.add(cursorMesh);

init();

function init() {
  renderMaterialControls();
  renderShapeControls();
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
  document.getElementById("copyBlock").addEventListener("click", copySelected);
  document.getElementById("pasteBlock").addEventListener("click", pasteCopied);
  document.getElementById("eraseBlock").addEventListener("click", eraseSelected);
  document.getElementById("rotateBlock").addEventListener("click", rotateSelectedOrPending);
  document.getElementById("alignMaterial").addEventListener("click", alignCurrentMaterial);
  document.getElementById("exportStl").addEventListener("click", exportStl);
  document.getElementById("applyWorkspace").addEventListener("click", applyWorkspace);
  document.getElementById("cameraLeft").addEventListener("click", () => rotateCamera(-0.2));
  document.getElementById("cameraRight").addEventListener("click", () => rotateCamera(0.2));
  elements.selectedMaterial.addEventListener("change", changeSelectedMaterial);
  elements.canvas.addEventListener("click", placeOrSelectAtCursor);
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("keydown", handleKeydown);
  elements.canvas.addEventListener("wheel", handleWheel, { passive: true });
}

function renderMaterialControls() {
  elements.materialList.innerHTML = "";
  elements.selectedMaterial.innerHTML = "";
  for (const material of Object.values(MATERIALS)) {
    const button = document.createElement("button");
    button.className = "material-button";
    button.dataset.material = material.id;
    button.innerHTML = `<img src="${ASSET}/material_previews/${material.id === "stone_slab" ? "stone_slab" : material.id}.svg" alt=""><span>${material.label}</span>`;
    button.addEventListener("click", () => {
      state.selectedMaterial = material.id;
      updateUi();
    });
    elements.materialList.append(button);

    const option = document.createElement("option");
    option.value = material.id;
    option.textContent = material.label;
    elements.selectedMaterial.append(option);
  }
}

function renderShapeControls() {
  const iconByShape = {
    cube: "cube.svg",
    prism_30: "prism_30.svg",
    prism_45: "prism_45.svg"
  };
  elements.shapeList.innerHTML = "";
  for (const shape of Object.values(SHAPES)) {
    const button = document.createElement("button");
    button.className = "shape-button";
    button.dataset.shape = shape.id;
    button.innerHTML = `<img src="${ASSET}/shape_icons/${iconByShape[shape.id]}" alt=""><span>${shape.label}</span>`;
    button.addEventListener("click", () => {
      state.selectedShape = shape.id;
      updateUi();
    });
    elements.shapeList.append(button);
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
  }
  updateCursorMesh();
}

function createBlockMesh(block) {
  const material = new THREE.MeshStandardMaterial({
    color: MATERIALS[block.material]?.color || "#b84b3f",
    roughness: 0.8,
    metalness: 0
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
  if (state.selected && samePosition(block, state.selected)) {
    const outline = new THREE.BoxHelper(mesh, "#16746d");
    mesh.add(outline);
  }
  return mesh;
}

function createGeometry(shape) {
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

function updateCursorMesh() {
  cursorMesh.position.set(
    state.cursor.x * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    state.cursor.y * CELL_SIZE_MM + CELL_SIZE_MM / 2,
    state.cursor.z * CELL_SIZE_MM + CELL_SIZE_MM / 2
  );
}

function tick() {
  resizeRenderer();
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
    (state.project.workspaceCells.x * CELL_SIZE_MM) / 2,
    (state.project.workspaceCells.y * CELL_SIZE_MM) / 2,
    Math.max(120, (state.project.workspaceCells.z * CELL_SIZE_MM) / 2)
  );
  const distance = Math.max(state.project.workspaceCells.x, state.project.workspaceCells.y, state.project.workspaceCells.z) * CELL_SIZE_MM * 1.8;
  camera.position.set(
    center.x + Math.cos(state.cameraAngle) * distance,
    center.y + Math.sin(state.cameraAngle) * distance,
    center.z + distance * 0.62
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

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  if (event.metaKey || event.ctrlKey) {
    if (key === "z" && !event.shiftKey) return undo();
    if ((key === "z" && event.shiftKey) || key === "y") return redo();
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
  }
  if (key === "w") rotateCamera(0.12);
  if (key === "a") rotateCamera(-0.12);
  if (key === "s") rotateCamera(-0.12);
  if (key === "d") rotateCamera(0.12);
  if (event.key === "ArrowLeft") moveCursor(-1, 0, 0);
  if (event.key === "ArrowRight") moveCursor(1, 0, 0);
  if (event.key === "ArrowUp") moveCursor(0, 1, 0);
  if (event.key === "ArrowDown") moveCursor(0, -1, 0);
  if (event.key === "PageUp") moveCursor(0, 0, 1);
  if (event.key === "PageDown") moveCursor(0, 0, -1);
  if (event.key === "Delete" || event.key === "Backspace") eraseSelected();
}

function handleWheel(event) {
  camera.zoom = THREE.MathUtils.clamp(camera.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 0.45, 2.4);
  camera.updateProjectionMatrix();
}

function moveCursor(dx, dy, dz) {
  state.cursor.x = clamp(state.cursor.x + dx, 0, state.project.workspaceCells.x - 1);
  state.cursor.y = clamp(state.cursor.y + dy, 0, state.project.workspaceCells.y - 1);
  state.cursor.z = clamp(state.cursor.z + dz, 0, state.project.workspaceCells.z - 1);
  updateCursorMesh();
  updateUi();
}

function rotateCamera(delta) {
  state.cameraAngle += delta;
}

function commitProject(project) {
  state.project = state.history.commit(project);
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
  const block = getBlock(state.project, target);
  if (!block) return setWarning("沒有可清除的方塊。");
  if (!confirm("確定要清除這個方塊嗎？可用復原救回。")) return;
  const result = removeBlock(state.project, target);
  if (result.ok) {
    state.selected = null;
    commitProject(result.project);
    setWarning("已清除方塊。");
  }
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
  const result = resizeWorkspace(state.project, {
    x: Number(elements.workspaceX.value),
    y: Number(elements.workspaceY.value),
    z: Number(elements.workspaceZ.value)
  });
  if (!result.ok) {
    updateWorkspaceInputs();
    return setWarning(result.reason);
  }
  commitProject(result.project);
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
}

function updateUi() {
  document.querySelectorAll("[data-material]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.material === state.selectedMaterial);
  });
  document.querySelectorAll("[data-shape]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.shape === state.selectedShape);
  });
  const selectedBlock = state.selected ? getBlock(state.project, state.selected) : null;
  elements.selectionInfo.textContent = selectedBlock
    ? `${MATERIALS[selectedBlock.material].label} / ${SHAPES[selectedBlock.shape].label} / ${selectedBlock.x},${selectedBlock.y},${selectedBlock.z}`
    : "尚未選取";
  elements.selectedMaterial.value = selectedBlock?.material || state.selectedMaterial;
  elements.blockCount.textContent = `方塊 ${state.project.blocks.length} / ${MAX_BLOCKS}`;
  elements.cursorState.textContent = `游標：${state.cursor.x}, ${state.cursor.y}, ${state.cursor.z}`;
  elements.modeState.textContent = `材質：${MATERIALS[state.selectedMaterial].label}　形狀：${SHAPES[state.selectedShape].label}　旋轉：${state.pendingRotation}°`;
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
