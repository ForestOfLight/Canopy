import { system, world } from "@minecraft/server";
import Rules from "../../lib/canopy/Rules";

class ItemCounterChannels {
    static colors = Object.freeze(new Array('red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'lightBlue', 'blue', 'purple', 
        'pink', 'magenta', 'brown', 'black', 'white', 'lightGray', 'gray'));
    static channels = [];
    static ChannelClass;
    static controllingRule;

    static init(channelClass, controllingRuleId) {
        if (this instanceof ItemCounterChannels)
            throw new Error("Cannot instantiate abstract class 'ItemCounterChannels'");
        this.controllingRule = Rules.get(controllingRuleId);
        this.channelClass = channelClass;
        for (const color of this.colors) {
            const channel = new this.ChannelClass(color);
            const channelData = channel.getData();
            this.channels[color] = channel;
            if (channelData)
                channel.setData(channelData);
        }
        this.#initEvents();
    }

    static tryCreateHopperBlockPair() {
        throw new Error("Method 'tryCreateHopperBlockPair' must be implemented");
    }

    static addHopper(hopper, color) {
        if (!this.isValidColor(color)) return;
        this.channels[color].addHopper(hopper);
    }

    static isHopper(block) {
        return block?.typeId === 'minecraft:hopper';
    }

    static resetCounts(color) {
        this.channels[color].reset();
    }

    static resetAllCounts() {
        for (const channel of this.channels)
            channel.reset();
    }

    static isValidColor(color) {
        return this.colors.includes(color);
    }

    static getQueryOutput(color, useRealTime = false) {
        this.channels[color].getQueryOutput(useRealTime);
    }

    static getAllQueryOutput(translatableFailString, useRealTime = false) {
        let message = { rawtext: [] };
        for (const channel of this.channels) {
            if (channel.hopperList.length === 0)
                return;
            message.rawtext.push({ rawtext: [this.getQueryOutput(useRealTime), { text: '\n' }] });
        };
        if (message.rawtext.length === 0)
            message = { translate: translatableFailString };
        return message;
    }

    static #initEvents() {
        world.afterEvents.playerPlaceBlock.subscribe((event) => this.#onPlayerPlaceBlock(event.block));
        system.runInterval(() => this.#onTick(), 1);
    }

    static #onPlayerPlaceBlock(placedBlock) {
        if (this.controllingRule.getNativeValue()) return;
        this.tryCreateHopperBlockPair(placedBlock);
    }

    static #onTick() {
        if (!this.controllingRule.getNativeValue()) return;
        for (const channel of this.channels)
            channel.onTick();
    }
}

export default ItemCounterChannels;