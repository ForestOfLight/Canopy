import { system, world } from "@minecraft/server";
import Rules from "../../lib/canopy/Rules";

class ItemCounterChannels {
    static colors = Object.freeze(new Array('red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'lightBlue', 'blue', 'purple', 
        'pink', 'magenta', 'brown', 'black', 'white', 'lightGray', 'gray'));
    static modes = Object.freeze(new Array('count', 'hr', 'min', 'sec'));
    static channels = {};
    static controllingRuleID;

    static init(ChannelClass, controllingRuleID) {
        if (this === ItemCounterChannels)
            throw new Error("Cannot instantiate abstract class 'ItemCounterChannels'");
        this.controllingRuleID = controllingRuleID;
        for (const color of this.colors) {
            const channel = new ChannelClass(color);
            const channelData = channel.getData();
            this.channels[color] = channel;
            if (channelData)
                channel.setData(channelData);
        }
        this.initEvents();
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
        for (const channel of Object.values(this.channels))
            channel.reset();
    }

    static setMode(color, mode) {
        if (!this.isValidColor(color) || !this.isValidMode(mode)) return;
        this.channels[color].mode = mode;
    }

    static setAllModes(mode) {
        if (!this.isValidMode(mode)) return;
        for (const channel of Object.values(this.channels))
            channel.mode = mode;
    }

    static isValidColor(color) {
        return this.colors.includes(color);
    }

    static isValidMode(mode) {
        return this.modes.includes(mode);
    }

    static getQueryOutput(color, useRealTime = false) {
        this.channels[color].getQueryOutput(useRealTime);
    }

    static getAllQueryOutput(translatableFailString, useRealTime = false) {
        let message = { rawtext: [] };
        for (const channel of Object.values(this.channels)) {
            if (channel.hopperList.length === 0)
                return;
            message.rawtext.push({ rawtext: [this.getQueryOutput(useRealTime), { text: '\n' }] });
        };
        if (message.rawtext.length === 0)
            message = { translate: translatableFailString };
        return message;
    }

    static getActiveChannels() {
        return Object.values(this.channels).filter(channel => channel.hopperList.length > 0);
    }

    static initEvents() {
        world.afterEvents.playerPlaceBlock.subscribe((event) => this.onPlayerPlaceBlock(event.block));
        system.runInterval(() => this.onTick(), 1);
    }

    static onPlayerPlaceBlock(placedBlock) {
        if (!Rules.getNativeValue(this.controllingRuleID)) return;
        this.tryCreateHopperBlockPair(placedBlock);
    }

    static onTick() {
        if (!Rules.getNativeValue(this.controllingRuleID)) return;
        for (const channel of Object.values(this.channels))
            channel.onTick();
    }
}

export default ItemCounterChannels;