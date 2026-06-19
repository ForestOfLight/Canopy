import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { DebugPoint } from "./DebugPoint";
import { Rules } from "../../../lib/canopy/rules/Rules";

export class ExplosionRayOrigin extends DebugDisplayShapeElement {
    
    createShapes() {
        this.points = [];
        let shapesToDraw = [];
        if (!this.isExplosive())
            return;
        const origins = this.getExplosionRayOrigins();
        origins.forEach((origin, index) => {
            shapesToDraw.push(...this.handleSetup(origin))
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

    handleSetup(origin) {
        const color = { red: 0, green: 255, blue: 0, alpha: 1 }; 
        const dimensionLocation = { ...origin, dimension: this.entity.dimension };
        const point = new DebugPoint(dimensionLocation, 0.2, color); //custom debug display
        this.points.push(point);
        return point.createShapes();
    }

    isExplosive() {
        if (this.entity.typeId == "minecraft:wither_skelton") return;
        const explosiveEntities = ['creeper','wither','fireball','tnt','wind','crystal', 'sulfur'];
        return explosiveEntities.some(pattern => this.entity.typeId.includes(pattern));
    }

    getExplosionRayOrigins() {
      if (this.entity.typeId == "minecraft:tnt") {
          return [
              {x: 0, y: 0.06125, z: 0},
              {x: 0, y: 1.06125, z: 0}
          ];
      }
      if (this.entity.typeId == "minecraft:tnt_minecart") {
          return [
              {x: 0, y: 0.04, z: 0},
              {x: 0, y: 1, z: 0}
          ]; 
      }
      if (this.entity.typeId == "minecraft:wither") {
          return [
              {x: 0, y: 2.7, z: 0}
          ];
      }
      return [{x: 0, y: 0, z: 0}];
    }
}
