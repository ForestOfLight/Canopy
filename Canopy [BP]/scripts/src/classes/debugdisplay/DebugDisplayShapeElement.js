import { debugDrawer } from "@minecraft/debug-utilities";
import { DebugDisplayElement } from "./DebugDisplayElement";

export class DebugDisplayShapeElement extends DebugDisplayElement {
    shapes = [];
    
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

    drawShapes() {
        this.shapes.forEach(shape => {
            if (this.visibleToPlayer)
                shape.visibleTo = [this.visibleToPlayer];
            debugDrawer.addShape(shape)
        });
    }

    clearShapes() {
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
    }

    drawShape(debugShape) {
        debugShape.attachedTo = this.entity;
        this.shapes.push(debugShape);
        debugDrawer.addShape(debugShape);
    }

    update() {
        throw new Error("Method 'update()' must be implemented.");
    }
}