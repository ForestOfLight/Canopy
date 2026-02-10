import { debugDrawer } from "@minecraft/debug-utilities";
import { DebugDisplayElement } from "./DebugDisplayElement";

export class DebugDisplayShapeElement extends DebugDisplayElement {
    shapes = [];
    visibleToPlayer;
    
    constructor(entity, visibleToPlayer = void 0) {
        super(entity);
        this.visibleToPlayer = visibleToPlayer;
        if (this.constructor === DebugDisplayShapeElement) 
            throw new TypeError("Abstract class 'DebugDisplayShapeElement' cannot be instantiated directly.");
        this.createShapes();
    }

    destroy() {
        this.clearShapes();
    }

    createShapes() {
        throw new Error("Method 'createShapes()' must be implemented.");
    }

    clearShapes() {
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
    }

    drawShape(debugShape) {
        debugShape.attachedTo = this.entity;
        if (this.visibleToPlayer)
            debugShape.visibleTo = [this.visibleToPlayer];
        this.shapes.push(debugShape);
        debugDrawer.addShape(debugShape);
    }

    update() {
        throw new Error("Method 'update()' must be implemented.");
    }
}