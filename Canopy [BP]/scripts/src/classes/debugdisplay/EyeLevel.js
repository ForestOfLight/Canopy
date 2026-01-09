import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class EyeLevel extends DebugDisplayShapeElement {
    createShapes() {
        const eyeLevelData = this.getEyeLevelBoxBounds();
        const dimensionLocation = { ...eyeLevelData.location, dimension: this.entity.dimension };
        const eyeLevel = new DebugBox(dimensionLocation);
        eyeLevel.bound = eyeLevelData.size;
        eyeLevel.color = { red: 1, green: 0, blue: 0 };
        this.drawShape(eyeLevel);
    }

    getCollisionBox() {
        const AABB = this.entity.getAABB();
        return {
            location: Vector.from(AABB.center).subtract(this.entity.location).subtract(AABB.extent),
            size: Vector.from(AABB.extent).multiply(2)
        };
    }

    getEyeLevelBoxBounds() {
        const collisionBoxData = this.getCollisionBox();
        return {
            location: Vector.from(collisionBoxData.location).add(new Vector(0, this.entity.getHeadLocation().y - this.entity.location.y, 0)),
            size: new Vector(collisionBoxData.size.x, 0, collisionBoxData.size.z)
        }
    }
}