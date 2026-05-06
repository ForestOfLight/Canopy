import { world, TextPrimitive } from '@minecraft/server';
import { Vector } from "../../../lib/Vector";

export class DebugDisplayTextDrawer {
    textShape;
    debugDisplay;

    constructor(debugDisplay) {
        this.debugDisplay = debugDisplay;
        this.beginDraw();
    }

    destroy() {
        this.textShape.remove();
        this.debugDisplay = void 0;
    }

    update() {
        this.textShape.setText(this.debugDisplay.debugMessage);
    }

    beginDraw() {
        if (this.isDrawing())
            return;
        const dimensionLocation = { ...this.getTextLocation(), dimension: this.dimension };
        this.textShape = new TextPrimitive(dimensionLocation, this.debugDisplay.debugMessage);
        this.textShape.attachedTo = this.debugDisplay.entity;
        world.primitiveShapesManager.addText(this.textShape);
    }
    
    isDrawing() {
        return this.textShape !== void 0;
    }

    getTextLocation() {
        const entity = this.debugDisplay.entity;
        const AABB = entity.getAABB();
        const heightDisplacement = new Vector(0, Vector.from(entity.getHeadLocation()).subtract(AABB.center).y, 0).add(Vector.up);
        return heightDisplacement;
    }
}