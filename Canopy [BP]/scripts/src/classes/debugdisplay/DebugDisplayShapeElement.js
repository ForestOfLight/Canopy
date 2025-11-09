import { debugDrawer } from "@minecraft/debug-utilities";
import { DebugDisplayElement } from "./DebugDisplayElement";

export class DebugDisplayShapeElement extends DebugDisplayElement {
    shapes = [];
    
    constructor(entity) {
        super(entity);
        if (this.constructor === DebugDisplayShapeElement) 
            throw new TypeError("Abstract class 'DebugDisplayShapeElement' cannot be instantiated directly.");
        this.createShapes();
        this.drawShapes();
    }

    destroy() {
        this.clearShapes();
    }

    createShapes() {
        throw new Error("Method 'createShapes()' must be implemented.");
    }

    drawShapes() {
        this.shapes.forEach(shape => debugDrawer.addShape(shape));
    }

    clearShapes() {
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
    }

    update() {
        throw new Error("Method 'update()' must be implemented.");
    }
}