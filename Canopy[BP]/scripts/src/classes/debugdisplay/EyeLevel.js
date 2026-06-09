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
        eyeLevel.color = { red: 1, green: 1, blue: 0, alpha: 1 };
        this.drawShape(eyeLevel);
    }

    update() {
        const eyeLevelData = this.getEyeLevelBoxBounds();
        this.shapes[0].bound = eyeLevelData.size;
    }

    getEyeLevelBoxBounds() {
        const AABB = this.entity.getAABB();
        const headHeight = this.entity.getHeadLocation().y - this.entity.location.y;
        return {
            location: new Vector(0, headHeight + AABB.extent.y * 0.1, 0),
            size: new Vector(AABB.extent.x * 2, 0, AABB.extent.z * 2)
        }
    }

    getClientSideLocation() {
        return this.getEyeLevelBoxBounds().location;
    }
}
