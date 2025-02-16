class SymbolTable {
  constructor(parent = null) {
    this.symbols = {};
    this.parent = parent;
  }

  get(name) {
    let value = this.symbols[name] ?? null;
    if (value == null && this.parent) return this.parent.get(name);
    return value;
  }

  set(name, value) {
    this.symbols[name] = value;
  }

  remove(name) {
    delete this.symbols[name];
  }
}

module.exports = { SymbolTable };
