import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class EyeLevel extends DebugDisplayShapeElement {
    eyeLevel;

    createShapes() {
        const eyeLevelData = this.getEyeLevelBoxBounds();
        const dimensionLocation = { ...eyeLevelData.location, dimension: this.entity.dimension };
        const eyeLevel = new DebugBox(dimensionLocation);
        eyeLevel.bound = eyeLevelData.size;
        eyeLevel.color = { red: 1, green: 0, blue: 0 };
        this.drawShape(eyeLevel);
    }

    update() {
        const eyeLevelData = this.getEyeLevelBoxBounds();
        this.shapes[0].bound = eyeLevelData.size;
    }

    getEyeLevelBoxBounds() {
        const AABB = this.entity.getAABB();
        return {
            location: new Vector(-AABB.extent.x, this.entity.getHeadLocation().y - this.entity.location.y, -AABB.extent.z),
            size: new Vector(AABB.extent.x * 2, 0, AABB.extent.z * 2)
        }
    }
}