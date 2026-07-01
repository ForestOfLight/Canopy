import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class HeadLevel extends DebugDisplayShapeElement {
    headLevel;

    createShapes() {
        const headLevelData = this.getHeadLevelBoxBounds();
        const dimensionLocation = { ...headLevelData.location, dimension: this.entity.dimension };
        const headLevel = new DebugBox(dimensionLocation);
        headLevel.bound = headLevelData.size;
        headLevel.color = { red: 1, green: 0, blue: 0, alpha: 1 };
        this.drawShape(headLevel);
    }

    update() {
        const headLevelData = this.getHeadLevelBoxBounds();
        this.shapes[0].bound = headLevelData.size;
    }

    getHeadLevelBoxBounds() {
        const AABB = this.entity.getAABB();
        return {
            location: new Vector(0, this.entity.getHeadLocation().y - this.entity.location.y, 0),
            size: new Vector(AABB.extent.x * 2, 0, AABB.extent.z * 2)
        }
    }

    getClientSideLocation() {
        return this.getEyeLevelBoxBounds().location;
    }
}
