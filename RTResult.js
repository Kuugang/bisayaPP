class RTResult {
  constructor() {
    this.reset();
  }

  reset() {
    this.value = null;
    this.error = null;
    this.func_return_value = null;
    this.loop_should_continue = false;
    this.loop_should_break = false;
  }

  register(res) {
    this.error = res.error;
    this.func_return_value = res.func_return_value;
    this.loop_should_continue = res.loop_should_continue;
    this.loop_should_break = res.loop_should_break;
    return res.value;
  }

  success(value) {
    this.reset();
    this.value = value;
    return this;
  }

  success_return(value) {
    this.reset();
    this.func_return_value = value;
    return this;
  }

  success_continue() {
    this.reset();
    this.loop_should_continue = true;
    return this;
  }

  success_break() {
    this.reset();
    this.loop_should_break = true;
    return this;
  }

  failure(error) {
    this.reset();
    this.error = error;
    return this;
  }

  should_return() {
    // Note: this will allow you to continue and break outside the current function
    return (
      this.error ||
      this.func_return_value ||
      this.loop_should_continue ||
      this.loop_should_break
    );
  }
}

module.exports = {
  RTResult,
};

