import { system, world } from "@minecraft/server";
import Rules from "../../lib/canopy/Rules";

class ItemCounterChannels {
    constructor(ChannelClass, controllingRuleID) {
        ItemCounterChannels.colors = Object.freeze(['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'lightBlue', 'blue', 'purple', 
            'pink', 'magenta', 'brown', 'black', 'white', 'lightGray', 'gray']);
        ItemCounterChannels.modes = Object.freeze(['count', 'hr', 'min', 'sec']);
        this.colors = ItemCounterChannels.colors;
        this.modes = ItemCounterChannels.modes;
        this.controllingRuleID = controllingRuleID;
        this.channels = {};

        for (const color of this.colors) {
            const channel = new ChannelClass(color);
            const channelData = channel.getData();
            this.channels[color] = channel;
            if (channelData)
                channel.initData(channelData);
        }
        this.initEvents();
    }

    tryCreateHopperBlockPair() {
        throw new Error("Method 'tryCreateHopperBlockPair' must be implemented");
    }

    addHopper(hopper, color) {
        if (!this.isValidColor(color)) return;
        this.channels[color].addHopper(hopper);
    }

    isHopper(block) {
        return block?.typeId === 'minecraft:hopper';
    }

    resetCounts(color) {
        this.channels[color].reset();
    }

    resetAllCounts() {
        for (const channel of Object.values(this.channels))
            channel.reset();
    }

    disable() {
        for (const channel of Object.values(this.channels))
            channel.disable();
    }

    setMode(color, mode) {
        if (!this.isValidColor(color) || !this.isValidMode(mode)) return;
        this.channels[color].mode = mode;
    }

    setAllModes(mode) {
        if (!this.isValidMode(mode)) return;
        for (const channel of Object.values(this.channels))
            channel.mode = mode;
    }

    isValidColor(color) {
        return this.colors.includes(color);
    }

    isValidMode(mode) {
        return this.modes.includes(mode);
    }

    getQueryOutput(color, useRealTime = false) {
        return this.channels[color].getQueryOutput(useRealTime);
    }

    getAllQueryOutput(translatableFailString, useRealTime = false) {
        let message = { rawtext: [] };
        for (const channel of Object.values(this.channels)) {
            if (channel.hopperList.length === 0)
                continue;
            message.rawtext.push({ rawtext: [this.getQueryOutput(channel.color, useRealTime), { text: '\n' }] });
        };
        if (message.rawtext.length === 0)
            message = { translate: translatableFailString };
        return message;
    }

    getActiveChannels() {
        return Object.values(this.channels).filter(channel => channel.hopperList.length > 0);
    }

    initEvents() {
        world.afterEvents.playerPlaceBlock.subscribe((event) => this.onPlayerPlaceBlock(event.block));
        system.runInterval(() => this.onTick(), 1);
    }

    onPlayerPlaceBlock(placedBlock) {
        if (!Rules.getNativeValue(this.controllingRuleID)) return;
        this.tryCreateHopperBlockPair(placedBlock);
    }

    onTick() {
        if (!Rules.getNativeValue(this.controllingRuleID)) return;
        for (const channel of Object.values(this.channels))
            channel.onTick();
    }
}

export default ItemCounterChannels;
