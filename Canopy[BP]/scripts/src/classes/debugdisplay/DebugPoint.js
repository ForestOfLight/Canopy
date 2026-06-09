import { DebugArrow } from "@minecraft/debug-utilities";

export class DebugPoint {
  constructor(dL, size, color) {
    this.dL = dL;
    this.size = size;
    this.color = color;
    this.Arrows = [];
  }
  createShapes() {
    const UpArrow = this.genNewArrow(this.size);
    const DownArrow = this.genNewArrow(-this.size);
    this.setup(UpArrow);
    this.setup(DownArrow);
    this.Arrows = [UpArrow,DownArrow];
    return this.Arrows;
  }
  updateShapes(newPos) {
    this.Arrows[0].location = newPos
    this.Arrows[1].location = newPos
    this.updateEnd(newPos, this.size, this.Arrows[0]);
    this.updateEnd(newPos, -this.size, this.Arrows[1]);
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
  setup(Arrow) {
    Arrow.headLength = this.size;
    Arrow.headRadius = this.size;
    Arrow.color = this.color;
  }
  updateEnd(newPos, offset, arrow) {
    arrow.endLocation = {
      x: newPos.x, 
      y: newPos.y + offset, 
      z: newPos.z
    }
  }
}
