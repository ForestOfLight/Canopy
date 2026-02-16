import { debugDrawer } from "@minecraft/debug-utilities";
import { DebugDisplayElement } from "./DebugDisplayElement";
import { system } from "@minecraft/server";
import { Rules } from "../../../lib/canopy/Canopy";

export class DebugDisplayShapeElement extends DebugDisplayElement {
    shapes = [];
    visibleToPlayer;
    serverSidePositionRunner = void 0;
    
    constructor(entity, visibleToPlayer = void 0) {
        super(entity);
        this.visibleToPlayer = visibleToPlayer;
        if (this.constructor === DebugDisplayShapeElement) 
            throw new TypeError("Abstract class 'DebugDisplayShapeElement' cannot be instantiated directly.");
        this.createShapes();
    }

    destroy() {
        this.clearShapes();
        this.stopServerSidePositionRendering();
    }

    createShapes() {
        throw new Error("Method 'createShapes()' must be implemented.");
    }

    clearShapes() {
        this.shapes.forEach(shape => debugDrawer.removeShape(shape));
        this.shapes.length = 0;
    }

    drawShape(debugShape) {
        this.setupPosition(debugShape);
        if (this.visibleToPlayer)
            debugShape.visibleTo = [this.visibleToPlayer];
        this.shapes.push(debugShape);
        debugDrawer.addShape(debugShape);
    }

    update() {
        throw new Error("Method 'update()' must be implemented.");
    }

    getClientSideLocation() {
        throw new Error("Method 'getClientSideLocation()' must be implemented.");
    }

    setupPosition(debugShape) {
        if (Rules.getNativeValue('serverSideCollisionBoxes')) {
            this.serverSidePositionRunner = system.runInterval(() => this.updateServerSidePosition());
        } else {
            this.stopServerSidePositionRendering();
            debugShape.attachedTo = this.entity;
        }
    }

    updateServerSidePosition() {
        if (!this.entity?.isValid) {
            this.destroy();
            return;
        }
        const dimensionLocation = this.getClientSideLocation().add(this.entity.location);
        dimensionLocation.dimension = this.entity.dimension;
        this.shapes.forEach((debugShape) => debugShape.setLocation(dimensionLocation));
    }

    stopServerSidePositionRendering() {
        if (this.serverSidePositionRunner !== void 0) {
            system.clearRun(this.serverSidePositionRunner);
            this.serverSidePositionRunner = void 0;
        }
    }
}