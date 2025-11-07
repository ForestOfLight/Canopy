import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugLine } from "@minecraft/debug-utilities";

export class ViewDirectionVector extends DebugDisplayShapeElement {
    createShapes() {
        const viewDirectionData = this.getViewDirectionBounds();
        this.eyeLevel = new DebugLine(viewDirectionData.location, viewDirectionData.endLocation);
        this.eyeLevel.color = { red: 0, green: 0, blue: 1 };
        this.shapes.push(this.eyeLevel);
    }

    update() {
        const viewDirectionData = this.getViewDirectionBounds();
        this.eyeLevel.location = viewDirectionData.location;
        this.eyeLevel.endLocation = viewDirectionData.endLocation;
    }

    getCollisionBox() {
        const AABB = this.entity.getAABB();
        return {
            location: Vector.from(AABB.center).subtract(AABB.extent),
            size: Vector.from(AABB.extent).multiply(2)
        };
    }

    getViewDirectionBounds() {
        const location = new Vector(this.entity.location.x, this.entity.getHeadLocation().y, this.entity.location.z);
        return {
            location,
            endLocation: location.add(this.entity.getViewDirection())
        }
    }
}