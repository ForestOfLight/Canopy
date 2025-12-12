import { debugDrawer, DebugText } from '@minecraft/debug-utilities';
import { Vector } from "../../../lib/Vector";

export class DebugDisplayTextDrawer {
    textShape;
    debugDisplay;

    constructor(debugDisplay) {
        this.debugDisplay = debugDisplay;
        this.beginDraw();
    }

    destroy() {
        debugDrawer.removeShape(this.textShape);
        this.debugDisplay = void 0;
    }

    update() {
        const dimensionLocation = { ...this.getTextLocation(), dimension: this.dimension };
        this.textShape.setLocation(dimensionLocation);
        this.textShape.text = this.debugDisplay.debugMessage;
    }

    beginDraw() {
        if (this.isDrawing())
            return;
        const dimensionLocation = { ...this.getTextLocation(), dimension: this.dimension };
        this.textShape = new DebugText(dimensionLocation, this.debugDisplay.debugMessage);
        debugDrawer.addShape(this.textShape);
    }
    
    isDrawing() {
        return this.textShape !== void 0;
    }

    getTextLocation() {
        const entity = this.debugDisplay.entity;
        const entityLocation = Vector.from(entity.location);
        const heightDisplacement = new Vector(0, Vector.from(entity.getHeadLocation()).subtract(entityLocation).y, 0).add(Vector.up);
        return entityLocation.add(heightDisplacement);
    }
}