import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugArrow } from "@minecraft/debug-utilities";

export class ViewDirectionVector extends DebugDisplayShapeElement {    
    createShapes() {
        const viewDirectionData = this.getViewDirectionBounds();
        const dimensionLocation = { ...viewDirectionData.location, dimension: this.entity.dimension };
        const viewDirectionVector = new DebugArrow(dimensionLocation, viewDirectionData.endLocation);
        viewDirectionVector.headLength = 0.20;
        viewDirectionVector.headRadius = 0.10;
        viewDirectionVector.color = { red: 0, green: 0, blue: 1 };
        this.drawShape(viewDirectionVector);
    }

    update() {
        const viewDirectionData = this.getViewDirectionBounds();
        this.shapes[0].endLocation = viewDirectionData.endLocation;
    }

    getViewDirectionBounds() {
        const AABB = this.entity.getAABB();
        const location = new Vector(0, this.entity.getHeadLocation().y - this.entity.location.y, 0);
        return {
            location,
            endLocation: location.add(this.entity.getViewDirection()).multiply(1 + AABB.extent.x)
        };
    }
}