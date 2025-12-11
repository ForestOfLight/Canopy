import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class EyeLevel extends DebugDisplayShapeElement {
    createShapes() {
        const eyeLevelData = this.getEyeLevelBoxBounds();
        const dimensionLocation = { ...eyeLevelData.location, dimension: this.entity.dimension };
        this.eyeLevel = new DebugBox(dimensionLocation);
        this.eyeLevel.bound = eyeLevelData.size;
        this.eyeLevel.color = { red: 1, green: 0, blue: 0 };
        this.shapes.push(this.eyeLevel);
    }

    update() {
        const eyeLevelData = this.getEyeLevelBoxBounds();
        this.eyeLevel.location = eyeLevelData.location;
        this.eyeLevel.bound = eyeLevelData.size;
    }

    getCollisionBox() {
        const AABB = this.entity.getAABB();
        return {
            location: Vector.from(AABB.center).subtract(AABB.extent),
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