import { world, system } from "@minecraft/server";
import GeneratorChannel from "./GeneratorChannel";
import Rules from "../../lib/canopy/Rules";

class GeneratorChannels {
    static colors = Object.freeze(new Array('red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'lightBlue', 'blue', 'purple', 
        'pink', 'magenta', 'brown', 'black', 'white', 'lightGray', 'gray'));
    static channels = [];

    static init() {
        if (world.getDynamicProperty('redGeneratorChannel')) {
            this.resetAllCounts();
        } else {
            for (const color of this.colors)
                world.setDynamicProperty(`${color}GeneratorChannel`, JSON.stringify(new GeneratorChannel(color)));
        }
    }

    static initEvents() {
        world.afterEvents.playerPlaceBlock.subscribe((event) => this.onPlayerPlaceBlock(event.block));
        system.runInterval(() => this.onTick(), 1);
    }

    static onPlayerPlaceBlock(block) {
        if ((block.typeId !== 'minecraft:hopper' 
            && !block.typeId.slice(-4) === 'wool')
            || !Rules.getNativeValue('hopperGenerators')) return;
        this.tryCreateGenerator(block);
    }

    static tryCreateGenerator(block) {
        if (block.typeId === 'minecraft:hopper') {
            const wool = block.above();
            if (wool?.typeId?.slice(-4) === 'wool') {
                const color = wool.typeId.replace('minecraft:', '').replace('_wool', '');
                this.channels[color].addGenerator(block);
            }
        } else if (block.typeId.slice(-4) === 'wool') {
            const hopper = block.below();
            if (hopper?.typeId === 'minecraft:hopper') {
                const color = block.typeId.replace('minecraft:', '').replace('_wool', '');
                this.channels[color].addGenerator(hopper);
            }
        }
    }

    static onTick() {
        if (!Rules.getNativeValue('hopperGenerators')) return;
        for (const channel of this.channels) {
            if (channel.hopperList.length === 0)
                return;
            channel.removeDestroyedGenerators();
            const generatedItems = channel.generateItems();
            channel.updateCount(generatedItems);
        }
    }

    static forEach(callback) {
        for (const color of this.colors) {
            const channel = this.getChannelData(color);
            callback(channel);
        }
    }

    static includes(hopper) {
        for (const color of this.colors) {
            const channel = this.getChannelData(color);
            if (channel.hopperList.find(hopperGenerator => 
                hopperGenerator.location.x === hopper.location.x
                && hopperGenerator.location.y === hopper.location.y
                && hopperGenerator.location.z === hopper.location.z
                && hopperGenerator.dimensionId === hopper.dimension.id
            )) return true;
        }
        return false;
    }

    static getChannelData(color) {
        let channel;
        try {
            channel = this.channels[color]
        } catch (e) {
            if (e.message === `No channel found for color ${color}`)
                channel = new GeneratorChannel(color);
        }
        return channel.getData();
    }

    static setChannelData(color, channelData) {
        this.channels[color].setData(channelData);
    }

    static resetCounts(color) {
        this.channels[color].reset();
    }

    static resetAllCounts() {
        for (const channel of this.channels)
            channel.reset();
    }

    static totalHoppersInUse() {
        let totalHoppers = 0;
        this.forEach(channel => {
            totalHoppers += channel.hopperList.length;
        });
        return totalHoppers;
    }

    static isValidColor(color) {
        return this.colors.includes(color);
    }

    static getQueryOutput(color, useRealTime = false) {
        this.channels[color].getQueryOutput(useRealTime);
    }

    static getAllQueryOutput(useRealTime = false) {
        let message = { rawtext: [] };
        for (const channel of this.channels) {
            if (channel.hopperList.length === 0)
                return;
            message.rawtext.push({ rawtext: [GeneratorChannels.getQueryOutput(useRealTime), { text: '\n' }] });
        };
    
        if (message.rawtext.length === 0)
            message = { translate: 'commands.generator.query.empty' };
        return message;
    }
}

GeneratorChannels.init();

export default GeneratorChannels;