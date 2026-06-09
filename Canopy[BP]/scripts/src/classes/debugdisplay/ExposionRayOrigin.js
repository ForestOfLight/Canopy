import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { DebugPoint } from "./DebugPoint";
import { Rules } from "../../../lib/canopy/rules/Rules";

export class ExplosionRayOrigin extends DebugDisplayShapeElement {
    
    createShapes() {
        this.points = [];
        let shapesToDraw = [];
        const origins = this.getExplosionRayOrigins();
        origins.forEach((origin, index) => {
            shapesToDraw.push(...this.handleSetup(origin, index * 255))
        });
        shapesToDraw.forEach(shape => {
            this.drawShape(shape);
        });
    }

    update() {
        if (!Rules.getNativeValue("serverSideCollisionBoxes")) {
            return;
        }
        this.getExplosionRayOrigins().forEach((origin, index) => {
            this.points[index].updateShapes(origin);
        });
    }

    handleSetup(origin, secondColor) {
        const color = { red: secondColor, green: 255, blue: 0, alpha: 1 }; 
        const dimensionLocation = { ...origin, dimension: this.entity.dimension };
        const point = new DebugPoint(dimensionLocation, 0.2, color); //custom debug display
        this.points.push(point);
        return point.createShapes();
    }
    
    getExplosionRayOrigins() {
      if (this.entity.typeId == "minecraft:tnt") {
          return [
            {x: 0, y: 0.06125, z: 0},
            {x: 0, y: 1.06125, z: 0}
          ];
      }
      return [{x: 0, y: 0, z: 0}];
    }
}
