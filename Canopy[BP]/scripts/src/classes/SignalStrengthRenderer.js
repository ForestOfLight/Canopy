import { system, TextPrimitive, world } from "@minecraft/server";
import { Vector } from "../../lib/Vector";

export class SignalStrengthRenderer {
    block;
    dimension;
    visibleToPlayer;
    textShape;
    runner = void 0;

    constructor(block, dimension, visibleToPlayer) {
        this.block = block;
        this.dimension = dimension;
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
        if (!this.block?.isValid || this.block.typeId !== "minecraft:redstone_wire") {
            this.stopRender();
            return;
        }
        this.updateRedstonePower();
    }

    updateRedstonePower() {
        const power = this.block.getRedstonePower();
        if (this.textShape.text !== String(power))
            this.textShape.setText(String(power));
    }

    createTextShape() {
        const dimensionlocation = Vector.from(this.block.center()).add(new Vector(-0.0125, -7.7/16, 0.0925));
        dimensionlocation.dimension = this.dimension;
        this.textShape = new TextPrimitive(dimensionlocation, String(this.block.getRedstonePower()));
        this.textShape.backgroundColorOverride = { red: 0, green: 0, blue: 0, alpha: 0 };
        this.textShape.rotation = { x: 90, y: 0, z: 0 };
        this.textShape.useRotation = true;
        this.textShape.depthTest = true;
        this.textShape.backfaceVisible = false;
        this.drawShape();
    }

    drawShape() {
        if (this.visibleToPlayer)
            this.textShape.visibleTo = [this.visibleToPlayer];
        world.primitiveShapesManager.addText(this.textShape);
    }
}