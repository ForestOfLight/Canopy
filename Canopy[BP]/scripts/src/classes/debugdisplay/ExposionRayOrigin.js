import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugPoint } from "./DebugPoint";
import { Rules } from "../../../lib/canopy/rules/Rules";


export class ExplosionRayOrigin extends DebugDisplayShapeElement {
    ExplosionRayOrigin;
    
    createShapes() {
        this.points = [];
        let ShapesToDraw;
        const Origins = this.getExplosionRayOrigins();
        if (this.entity.typeId == "minecraft:tnt") {
            const ShapeArray1 = this.handleSetup(Origins[0], 0);
            const ShapeArray2 = this.handleSetup(Origins[1], 255);
            ShapesToDraw = [...ShapeArray1, ...ShapeArray2];
        } else {
            ShapesToDraw = this.handleSetup(Origins, 0);
        }
        ShapesToDraw.forEach(shape => {
            this.drawShape(shape);
        });
    }

    update() {
        if (Rules.getNativeValue('serverSideCollisionBoxes')) {
            this.points[0].updateShapes(getExplosionRayOrigins()[0])
            this.points[1].updateShapes(getExplosionRayOrigins()[1])
        }
        return;
    }

    handleSetup(Origin, color) {
        const Color = { red: color, green: 255, blue: 0, alpha: 1 }; 
        const DimensionLocation = { ...Origin, dimension: this.entity.dimension };
        const Point = new DebugPoint(DimensionLocation, 0.2, Color); //custom debug display
        const ShapeArray = Point.createShapes();
        this.points.push(Point);
        return ShapeArray;
    }
    
    getExplosionRayOrigins() {
      if (this.entity.typeId == "minecraft:tnt") {
          const Origin1 = {x: 0, y: 0.06125, z: 0};
          const Origin2 = {x: 0, y: 1.06125, z: 0};
          return [Origin1,Origin2];
      }
      return {x: 0, y: 0, z: 0};
    }
}
