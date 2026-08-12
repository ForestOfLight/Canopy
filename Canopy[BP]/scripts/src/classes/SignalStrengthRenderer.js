import { system, TextPrimitive, world } from "@minecraft/server";

export class SignalStrengthRenderer {
    block;
    dimension;
    visibleToPlayer;
    textShape;
    #textOffset = { x: -0.0125, y: -7.7 / 16, z: 0.0925 };
    #lastCardinalYaw = void 0;
    #lastTextYaw = void 0;
    #runner = void 0;

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
        this.#runner = system.runInterval(this.onTick.bind(this));
    }

    stopRender() {
        if (this.#runner !== void 0) {
            system.clearRun(this.#runner);
            this.#runner = void 0;
        }
        this.textShape?.remove();
        this.textShape = void 0;
    }

    onTick() {
        if (!this.block?.isValid || this.block.typeId !== "minecraft:redstone_wire") {
            this.stopRender();
            return;
        }
        this.updateFacingRotation();
        this.updateRedstonePower();
    }

    updateFacingRotation() {
        if (!this.textShape || !this.visibleToPlayer?.isValid)
            return;

        const { cardinalYaw, textYaw } = this.#getCurrentFacing();
        if (this.#lastCardinalYaw === cardinalYaw && this.#lastTextYaw === textYaw)
            return;

        this.#lastCardinalYaw = cardinalYaw;
        this.#lastTextYaw = textYaw;
        this.textShape.rotation = { x: 90, y: textYaw, z: 0 };
        this.textShape.setLocation(this.#getTextLocationForYaw(cardinalYaw));
    }

    updateRedstonePower() {
        const power = this.#getRedstonePower(this.block);
        const text = String(power);
        const displayText = text.replace(/9/g, '9.');
        if (this.textShape.text !== displayText)
            this.textShape.setText(displayText);
    }

    createTextShape() {
        const { cardinalYaw, textYaw } = this.#getCurrentFacing();
        this.#lastCardinalYaw = cardinalYaw;
        this.#lastTextYaw = textYaw;
        this.textShape = new TextPrimitive(this.#getTextLocationForYaw(cardinalYaw), String(this.#getRedstonePower(this.block)));
        this.textShape.backgroundColorOverride = { red: 0, green: 0, blue: 0, alpha: 0 };
        this.textShape.rotation = { x: 90, y: textYaw, z: 0 };
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

    #getRedstonePower(block) {
        try {
            return block.getRedstonePower();
        } catch (error) {
            console.warn('[Canopy] Error while getting redstone power level: ', error);
            return '0';
        }
    }

    #snapYawToCardinal(yaw) {
        const normalizedYaw = ((yaw % 360) + 360) % 360;
        return (Math.round(normalizedYaw / 90) * 90) % 360;
    }

    #getTextYawForFacing(cardinalYaw) {
        if (cardinalYaw === 90 || cardinalYaw === 270)
            return (cardinalYaw + 180) % 360;
        return cardinalYaw;
    }

    #getCurrentFacing() {
        const playerYaw = this.visibleToPlayer?.isValid
            ? this.visibleToPlayer.getRotation().y
            : 0;
        const cardinalYaw = this.#snapYawToCardinal(playerYaw);
        const textYaw = this.#getTextYawForFacing(cardinalYaw);
        return { cardinalYaw, textYaw };
    }

    #getTextLocationForYaw(yaw) {
        const center = this.block.center();
        const radians = yaw * (Math.PI / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const offsetX = this.#textOffset.x * cos - this.#textOffset.z * sin;
        const offsetZ = this.#textOffset.x * sin + this.#textOffset.z * cos;
        return {
            x: center.x + offsetX,
            y: center.y + this.#textOffset.y,
            z: center.z + offsetZ,
            dimension: this.dimension,
        };
    }
}