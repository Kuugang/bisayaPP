const { RTError } = require("./Error");
const { TT_INT, TT_LETRA, TT_STRING, TT_BOOLEAN } = require("./Token");

class Value {
  constructor() {
    this.set_pos();
    this.set_context();
  }

  set_pos(pos_start = null, pos_end = null) {
    this.pos_start = pos_start;
    this.pos_end = pos_end;
    return this;
  }

  set_context(context = null) {
    this.context = context;
    return this;
  }

  add(other) {
    return [null, this.illegal_operation(other)];
  }
  subtract(other) {
    return [null, this.illegal_operation(other)];
  }
  multiply(other) {
    return [null, this.illegal_operation(other)];
  }
  divide(other) {
    return [null, this.illegal_operation(other)];
  }
  power(other) {
    return [null, this.illegal_operation(other)];
  }

  eq(other) {
    return [null, this.illegal_operation(other)];
  }

  ne(other) {
    return [null, this.illegal_operation(other)];
  }
  lt(other) {
    return [null, this.illegal_operation(other)];
  }
  gt(other) {
    return [null, this.illegal_operation(other)];
  }

  lte(other) {
    return [null, this.illegal_operation(other)];
  }
  gte(other) {
    return [null, this.illegal_operation(other)];
  }

  and(other) {
    return [null, this.illegal_operation(other)];
  }

  or(other) {
    return [null, this.illegal_operation(other)];
  }

  notted(other) {
    return [null, this.illegal_operation(other)];
  }

  execute(args) {
    return new RTResult().failure(this.illegal_operation());
  }

  copy() {
    throw new Error("No copy method defined");
  }

  is_true() {
    return false;
  }

  illegal_operation(other = null) {
    if (!other) other = this;
    return new RTError(
      this.pos_start,
      other.pos_end,
      "Illegal operation",
      this.context,
    );
  }
  toString() {
    return this.value + " ";
  }

  toJSON() {
    return this.toString();
  }

  [Symbol.toPrimitive](hint) {
    return this.toString();
  }
}

class Char extends Value {
  constructor(value) {
    super();
    this.value = value;
    this.type = TT_LETRA;
  }

  copy() {
    let copy = new Char(this.value);
    copy.set_pos(this.pos_start, this.pos_end);
    copy.set_context(this.context);
    return copy;
  }
}

class String extends Value {
  constructor(value) {
    super();
    this.value = value;
    this.type = TT_STRING;
  }

  copy() {
    let copy = new String(this.value);
    copy.set_pos(this.pos_start, this.pos_end);
    copy.set_context(this.context);
    return copy;
  }
}

class Boolean extends Value {
  constructor(value) {
    super();
    this.value = value;
    this.type = TT_BOOLEAN;
    this.num_value = value === "OO" ? 1 : 0;
  }

  and(other) {
    if (other instanceof Boolean) {
      return [
        new Boolean(this.num_value && other.num_value === 1 ? "OO" : "DILI"),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  or(other) {
    if (other instanceof Boolean) {
      return [
        new Boolean(this.num_value || other.num_value === 1 ? "OO" : "DILI"),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  notted() {
    return [new Boolean(this.num_value === 1 ? "DILI" : "OO"), null];
  }

  eq(other) {
    if (other instanceof Boolean) {
      return [
        new Boolean(this.num_value === other.num_value ? "OO" : "DILI"),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }
  ne(other) {
    if (other instanceof Boolean) {
      return [
        new Boolean(this.num_value !== other.num_value ? "OO" : "DILI"),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  copy() {
    let copy = new Boolean(this.value);
    copy.set_pos(this.pos_start, this.pos_end);
    copy.set_context(this.context);
    return copy;
  }
}

class Number extends Value {
  constructor(value, type) {
    super();
    this.type = type;
    if (type == "TIPIK") {
      this.value = Math.floor(value);
    } else {
      this.value = value;
    }
  }

  add(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value + other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  subtract(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value - other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  multiply(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value * other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  divide(other) {
    if (other instanceof Number) {
      if (other.value == 0) {
        return (
          null,
          new RTError(
            other.pos_start,
            other.pos_end,
            "Division by zero",
            this.context,
          )
        );
      }
      return [
        new Number(this.value / other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  modulo(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value % other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  notted() {
    return [
      new Number(this.value == 0 ? 1 : 0, this.type).set_context(this.context),
      null,
    ];
  }

  gt(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value > other.value ? 1 : 0, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  lt(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value < other.value ? 1 : 0, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  gte(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value >= other.value ? 1 : 0, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  lte(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value <= other.value ? 1 : 0, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  eq(other) {
    return [
      new Number(this.value === other.value ? 1 : 0, this.type).set_context(
        this.context,
      ),
      null,
    ];
  }

  ne(other) {
    return [
      new Number(this.value !== other.value ? 1 : 0, this.type).set_context(
        this.context,
      ),
      null,
    ];
  }

  or(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value || other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  and(other) {
    if (other instanceof Number) {
      return [
        new Number(this.value && other.value, this.type).set_context(
          this.context,
        ),
        null,
      ];
    } else {
      return [null, super.illegal_operation(other)];
    }
  }

  copy() {
    let copy = new Number(this.value, this.type);
    copy.set_pos(this.pos_start, this.pos_end);
    copy.set_context(this.context);
    return copy;
  }
  is_true() {
    return this.value != 0;
  }
}

class List extends Value {
  constructor(elements) {
    super();
    this.elements = elements;
  }

  add(other) {
    new_list = this.copy();
    new_list.elements.append(other);
    return new_list, null;
  }

  subtract(other) {
    if (other instanceof Number) {
      new_list = this.copy();
      try {
        newList.elements.splice(other.value, 1); // Removes the element at index `other.value`
        return [newList, null]; // Return as an array (since JS doesn't have tuple return)
      } catch (error) {
        return [
          null,
          new RTError(
            other.posStart,
            other.posEnd,
            "Element at this index could not be removed from list because index is out of bounds",
            this.context,
          ),
        ];
      }
    } else {
      return null, super.illegal_operation(other);
    }
  }

  multiply(other) {
    if (other instanceof List) {
      new_list = this.copy();
      new_list.elements.extend(other.elements);
      return new_list, null;
    } else {
      return null, super.illegal_operation(other);
    }
  }

  divide(other) {
    if (other instanceof Number) {
      try {
        return [this.elements[other.value], null];
      } catch (error) {
        return [
          null,
          new RTError(
            other.posStart,
            other.posEnd,
            "Element at this index could not be retrieved from list because index is out of bounds",
            this.context,
          ),
        ];
      }
    } else {
      return null, super.illegal_operation(other);
    }
  }

  copy() {
    copy = List(this.elements);
    copy.set_pos(this.pos_start, this.pos_end);
    copy.set_context(this.context);
    return copy;
  }

  toString() {
    return this.elements.map((x) => new String(x)).join(", ");
  }
}
module.exports = { Value, Char, String, Boolean, Number, List };
