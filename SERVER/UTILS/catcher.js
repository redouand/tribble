class CatcherHandler {
  constructor() {
    this.rooms = {};
    this.clients = {};
  }
  /**
   *
   * @param {string} side prop object you need it from class
   * @param {string} prop prop inside the object you want it (if you want all let it empty)
   * @returns {any};
   */
  getProperty(side, prop) {
    let required = null,
      _this = this;

    // check the props inside the object
    if (side && side in _this) {
      // put the side object will return object if prop does not exists
      required = side = _this[side];

      if (prop) {
        if (prop in side) required = side[prop];
        else if (prop === "all") required = _this;
      }
    }
    return required;
  }

  pushPropertyInsideObject(side, object) {
    let _this = this;
    if (side && object) {
      _this[side] = Object.assign({}, side in _this ? _this[side] : {}, object);
    }
  }
  removePropertyObject(side, prop) {
    let _this = this;
    if (side in _this) {
      if (prop in _this[side]) {
        delete _this[side][prop];
      } else if (prop === "all") {
        for (let porpObject in _this[side]) {
          delete _this[side][porpObject];
        }
      }
    }
  }
}

module.exports = { CatcherHandler };
