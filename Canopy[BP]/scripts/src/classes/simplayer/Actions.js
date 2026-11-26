import { system, TextPrimitive, world } from "@minecraft/server";
import { simplayerActionInfo } from "../../rules/simplayer/simplayerActionInfo";
import { Timeline } from "./timeline/Timeline";
import { TimelinePlayer } from "./timeline/TimelinePlayer";

const VANILLA_NAMEPLATE_RENDER_DISTANCE = 64;

export class Actions {
    #actionInfoDebugShape;
    #vanillaNameplateRenderDistance;
    #timeline = new Timeline();
    #timelinePlayer;

    constructor(understudy) {
        this.understudy = understudy;
        this.#timelinePlayer = new TimelinePlayer(understudy, this.#timeline);
    }

    onTick() {
        this.#timelinePlayer.onTick(system.currentTick);
        if (simplayerActionInfo.getNativeValue())
            this.#tickActionInfo();
        else
            this.#disableActionInfo();
    }

    get timeline() {
        return this.#timeline;
    }

    isEmpty() {
        return this.#timeline.isEmpty();
    }

    clear() {
        this.#timelinePlayer.stop();
        this.#timeline.reset();
    }

    #tickActionInfo() {
        const simplayer = this.understudy.simulatedPlayer;
        if (simplayer.nameplateRenderDistance > 0)
            this.#vanillaNameplateRenderDistance = simplayer.nameplateRenderDistance;
        const tracks = this.#timeline.tracks.filter(track => track.loops && !track.isEmpty());
        if (tracks.length === 0) {
            this.#disableActionInfo();
            return;
        }
        if (!this.#actionInfoDebugShape)
            this.#createActionInfoDebugShape();
        this.#actionInfoDebugShape.setText(this.#getActionInfoText(tracks));
    }

    #getActionInfoText(tracks) {
        const rawtext = [{ text: this.understudy.nameTag }];
        for (const track of tracks) {
            rawtext.at(-1).text += '\n§a';
            rawtext.push(...track.baseLabel(), { text: ` §7(${track.effectiveLength(this.#timeline.loopLength)}t)` });
        }
        return { rawtext };
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
        simplayer.nameplateRenderDistance = this.#vanillaNameplateRenderDistance || VANILLA_NAMEPLATE_RENDER_DISTANCE;
    }
}
