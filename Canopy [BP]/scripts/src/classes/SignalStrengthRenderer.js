import { debugDrawer, DebugText } from "@minecraft/debug-utilities";
import { system } from "@minecraft/server";
import { Vector } from "../../lib/Vector";

export class SignalStrengthRenderer {
    block;
    visibleToPlayer;
    textShape;
    runner = void 0;

    constructor(block, visibleToPlayer) {
        this.block = block;
        this.visibleToPlayer = visibleToPlayer;
        this.startRender();
    }

    destroy() {
        this.stopRender();
        this.block = void 0;
        this.visibleToPlayer = void 0;
    }

    startRender() {
        this.createTextShape();
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    stopRender() {
        if (this.runner !== void 0) {
            system.clearRun(this.runner);
            this.runner = void 0;
        }
        this.textShape?.remove();
        this.textShape = void 0;
    }

    onTick() {
        if (!this.block?.isValid || this.block.isAir) {
            this.stopRender();
            return;
        }
        this.textShape.setText(String(this.block.getRedstonePower()));
    }

    createTextShape() {
        const dimensionlocation = Vector.from(this.block.center()).add(new Vector(0, -7.5/16, 0.1));
        dimensionlocation.dimension = this.block.dimension;
        this.textShape = new DebugText(dimensionlocation, String(this.block.getRedstonePower()));
        this.textShape.backgroundColorOverride = { red: 0, green: 0, blue: 0, alpha: 0 };
        this.textShape.rotation = { x: 90, y: 0, z: 0 };
        this.textShape.useRotation = true;
        this.textShape.depthTest = true;
        this.drawShape(this.textShape);
    }

    drawShape(debugShape) {
        if (this.visibleToPlayer)
            debugShape.visibleTo = [this.visibleToPlayer];
        this.textShape = debugShape;
        debugDrawer.addShape(debugShape);
    }
}