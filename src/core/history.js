import { cloneProject } from "./model.js";
import { UNDO_LIMIT } from "./constants.js";

export class ProjectHistory {
  constructor(initialProject, limit = UNDO_LIMIT) {
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
    this.current = cloneProject(initialProject);
  }

  commit(project) {
    this.undoStack.push(cloneProject(this.current));
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.current = cloneProject(project);
    this.redoStack = [];
    return this.current;
  }

  undo() {
    if (this.undoStack.length === 0) {
      return this.current;
    }
    this.redoStack.push(cloneProject(this.current));
    this.current = this.undoStack.pop();
    return cloneProject(this.current);
  }

  redo() {
    if (this.redoStack.length === 0) {
      return this.current;
    }
    this.undoStack.push(cloneProject(this.current));
    this.current = this.redoStack.pop();
    return cloneProject(this.current);
  }
}

