'use strict';

class Bundle {
  constructor(id, parent) {
    this.id = id;
    this.parent = parent;

    this.files = new Map;
    this.children = [];
  }

  add(file) {
    if (!this.files.has(file.path)) {
      this.files.set(file.path, file);
    }
  }

  includes(path) {
    return this.files.has(path);
  }

  forEach(callback, thisArg) {
    this.files.forEach(callback, thisArg);
  }

  // Recursively removes files from bundles if they already exist in an
  // ancestor bundle.
  optimize(available) {
    available = new Set(available);

    for (let file of available) {
      this.files.delete(file.path);
    }

    this.files.forEach(file => available.add(file));
    this.children.forEach(child => child.optimize(available));
  }
}

global.Bundle = Bundle;
