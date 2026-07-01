import { DebugArrow } from "@minecraft/debug-utilities";

export class DebugPoint {
  constructor(dL, size, color) {
    this.dL = dL;
    this.size = size;
    this.color = color;
    this.Arrows = [];
  }
  createShapes() {
    const upArrow = this.genNewArrow(this.size);
    const downArrow = this.genNewArrow(-this.size);
    this.setup(upArrow);
    this.setup(downArrow);
    this.arrows = [upArrow,downArrow];
    return this.arrows;
  }
  updateShapes(newPos) {
    this.arrows[0].location = newPos
    this.arrows[1].location = newPos
    this.updateEnd(newPos, this.size, this.arrows[0]);
    this.updateEnd(newPos, -this.size, this.arrows[1]);
  }
  genNewArrow(offset) {
    return new DebugArrow(
      this.dL, 
      {
        x: this.dL.x, 
        y: this.dL.y + offset, 
        z: this.dL.z
      }
    );
  }
  setup(arrow) {
    arrow.headLength = this.size;
    arrow.headRadius = this.size;
    arrow.color = this.color;
  }
  updateEnd(newPos, offset, arrow) {
    arrow.endLocation = {
      x: newPos.x, 
      y: newPos.y + offset, 
      z: newPos.z
    }
  }
}
