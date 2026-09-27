import { system, TextPrimitive, world } from "@minecraft/server";
import { RepeatableAction } from "./RepeatableAction";
import { simplayerActionInfo } from "../../rules/simplayer/simplayerActionInfo";

export class Actions {
    #singleActions = [];
    #repeatingActions = [];
    #actionInfoDebugShape;
    #vanillaNameplateRenderDistance;

    constructor(understudy) {
        this.understudy = understudy;
    }

    onTick() {
        for (const singleAction of this.#singleActions)
            singleAction.perform();
        this.#singleActions.length = 0;
        for (const repeatingAction of this.#repeatingActions)
            repeatingAction.onTick();
        if (simplayerActionInfo.getNativeValue())
            this.#tickActionInfo();
    }

    once(type, afterTicks = void 0) {
        const repeatableAction = new RepeatableAction(this.understudy, type);
        if (afterTicks === void 0)
            this.#singleActions.push(repeatableAction);
        else
            system.runTimeout(() => this.#singleActions.push(repeatableAction), afterTicks);
    }

    repeat(type, intervalTicks = 0) {
        if (this.has(type))
            this.remove(type);
        const repeatingAction = new RepeatableAction(this.understudy, type, intervalTicks);
        this.#repeatingActions.push(repeatingAction);
    }

    get(type) {
        return this.#repeatingActions.find(action => action.type === type);
    }

    has(type) {
        return this.#repeatingActions.some(action => action.type === type);
    }

    isEmpty() {
        return this.#singleActions.length === 0 && this.#repeatingActions.length === 0;
    }

    remove(type) {
        this.#repeatingActions = this.#repeatingActions.filter(action => action.type !== type);
    }

    clear() {
        this.#repeatingActions.length = 0;
        this.#singleActions.length = 0;
    }

    #tickActionInfo() {
        const simplayer = this.understudy.simulatedPlayer;
        if (simplayer.nameplateRenderDistance > 0)
            this.#vanillaNameplateRenderDistance = simplayer.nameplateRenderDistance;
        if (this.#repeatingActions.length === 0) {
            this.#disableActionInfo();
            return;
        }
        if (!this.#actionInfoDebugShape)
            this.#createActionInfoDebugShape();
        this.#actionInfoDebugShape.setText(this.#getActionInfoText());
    }
    
    #getActionInfoText() {
        const output = { rawtext: [
            { text: this.understudy.nameTag + '\n' }
        ]};
        for (const repeatingAction of this.#repeatingActions) {
            output.rawtext.push({ translate: 'simplayer.action.line', with: { rawtext: [
                { translate: `simplayer.action.${repeatingAction.type}` },
                { text: String(repeatingAction.intervalTicks) }
            ] } })
            output.rawtext.push({ text: '\n' })
        }
        return output;
    }

    #createActionInfoDebugShape() {
        const simplayer = this.understudy.simulatedPlayer;
        simplayer.nameplateRenderDistance = 0;
        this.#actionInfoDebugShape = new TextPrimitive({ dimension: simplayer.dimension, x: 0, y: 2.3, z: 0 }, { text: '' });
        this.#actionInfoDebugShape.attachedTo = simplayer;
        world.primitiveShapesManager.addText(this.#actionInfoDebugShape);
    }

    #disableActionInfo() {
        if (this.#actionInfoDebugShape) {
            this.#actionInfoDebugShape.remove();
            this.#actionInfoDebugShape = void 0;
        }
        const simplayer = this.understudy.simulatedPlayer;
        simplayer.nameplateRenderDistance = this.#vanillaNameplateRenderDistance || 64;
    }
}
