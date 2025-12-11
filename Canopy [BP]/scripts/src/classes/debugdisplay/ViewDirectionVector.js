import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugLine } from "@minecraft/debug-utilities";

export class ViewDirectionVector extends DebugDisplayShapeElement {
    eyeLevel;
    
    createShapes() {
        const viewDirectionData = this.getViewDirectionBounds();
        const dimensionLocation = { ...viewDirectionData.location, dimension: this.entity.dimension };
        this.eyeLevel = new DebugLine(dimensionLocation, viewDirectionData.endLocation);
        this.eyeLevel.color = { red: 0, green: 0, blue: 1 };
        this.shapes.push(this.eyeLevel);
    }

    update() {
        const viewDirectionData = this.getViewDirectionBounds();
        this.eyeLevel.location = viewDirectionData.location;
        this.eyeLevel.endLocation = viewDirectionData.endLocation;
    }

    getViewDirectionBounds() {
        const location = new Vector(this.entity.location.x, this.entity.getHeadLocation().y, this.entity.location.z);
        return {
            location,
            endLocation: location.add(this.entity.getViewDirection())
        }
    }
}