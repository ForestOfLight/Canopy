import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugLine } from "@minecraft/debug-utilities";

export class ViewDirectionVector extends DebugDisplayShapeElement {    
    createShapes() {
        const viewDirectionData = this.getViewDirectionBounds();
        const dimensionLocation = { ...viewDirectionData.location, dimension: this.entity.dimension };
        this.viewDirectionVector = new DebugLine(dimensionLocation, viewDirectionData.endLocation);
        this.viewDirectionVector.color = { red: 0, green: 0, blue: 1 };
        this.shapes.push(this.viewDirectionVector);
    }

    update() {
        const viewDirectionData = this.getViewDirectionBounds();
        const dimensionLocation = { ...viewDirectionData.location, dimension: this.entity.dimension };
        this.viewDirectionVector.setLocation(dimensionLocation);
        this.viewDirectionVector.endLocation = viewDirectionData.endLocation;
    }

    getViewDirectionBounds() {
        const location = new Vector(this.entity.location.x, this.entity.getHeadLocation().y, this.entity.location.z);
        return {
            location,
            endLocation: location.add(this.entity.getViewDirection())
        };
    }
}