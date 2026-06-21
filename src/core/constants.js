export const CELL_SIZE_MM = 50;
export const DEFAULT_WORKSPACE_CELLS = Object.freeze({ x: 20, y: 20, z: 20 });
export const MAX_WORKSPACE_CELLS = Object.freeze({ x: 200, y: 200, z: 200 });
export const MAX_BLOCKS = 10000;
export const UNDO_LIMIT = 50;
export const AUTOSAVE_INTERVAL_MS = 60_000;
export const PROJECT_EXTENSION = ".m3dp";

export const MATERIALS = Object.freeze({
  brick: {
    id: "brick",
    label: "磚塊",
    color: "#b84b3f",
    reliefDepthMm: 2.4
  },
  plain: {
    id: "plain",
    label: "無材質",
    color: "#d8dad6",
    reliefDepthMm: 0.6
  }
});

export const SHAPES = Object.freeze({
  cube: {
    id: "cube",
    label: "方塊",
    maxHeightMm: 50
  },
  prism_30: {
    id: "prism_30",
    label: "30° 三角柱",
    maxHeightMm: Math.tan(Math.PI / 6) * CELL_SIZE_MM,
    restrictedTop: true
  },
  prism_45: {
    id: "prism_45",
    label: "45° 三角柱",
    maxHeightMm: CELL_SIZE_MM,
    restrictedTop: true
  },
  window_cross: {
    id: "window_cross",
    label: "十字窗",
    maxHeightMm: CELL_SIZE_MM,
    panelThicknessMm: 10
  },
  door_panel: {
    id: "door_panel",
    label: "門",
    maxHeightMm: CELL_SIZE_MM * 2,
    panelThicknessMm: 10,
    heightCells: 2
  }
});

export const PRINT_DEFAULTS = Object.freeze({
  seamRecessDepthMm: 1.0,
  minFeatureMm: 0.5,
  maxReliefMm: 10
});
