import { system, TextPrimitive, world } from "@minecraft/server";
import { Vector } from "../../lib/Vector";

export class LightLevelRenderer {
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
        if (!this.block?.isValid) {
            this.stopRender();
            return;
        }
        this.updateLightLevel();
    }

    updateLightLevel() {
        const lightLevel = this.block.getLightLevel();
        if (this.textShape.text !== this.colorLightLevel(lightLevel))
            this.textShape.setText(this.colorLightLevel(lightLevel));
    }

    createTextShape() {
        const dimensionlocation = Vector.from(this.block.center()).add(new Vector(-0.0125, -0.499, 0.0925));
        dimensionlocation.dimension = this.dimension;
        const lightLevel = this.block.getLightLevel();
        this.textShape = new TextPrimitive(dimensionlocation, this.colorLightLevel(lightLevel));
        this.textShape.backgroundColorOverride = { red: 0, green: 0, blue: 0, alpha: 0 };
        this.textShape.rotation = { x: 90, y: 0, z: 0 };
        this.textShape.useRotation = true;
        this.textShape.depthTest = true;
        this.textShape.backfaceVisible = false;
        this.drawShape();
    }

    colorLightLevel(lightLevel) {
        if (lightLevel < 1)
            return `§c${lightLevel}`;
        if (lightLevel < 5)
            return `§6${lightLevel}`;
        return `§e${lightLevel}`;
    }

    drawShape() {
        if (this.visibleToPlayer)
            this.textShape.visibleTo = [this.visibleToPlayer];
        world.primitiveShapesManager.addText(this.textShape);
    }
}