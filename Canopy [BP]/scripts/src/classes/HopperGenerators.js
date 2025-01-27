import { system, world } from "@minecraft/server";
import Utils from "include/utils";
import { formatColor, getAllModeOutput } from "src/commands/generator";

class HopperGenerator {
    constructor(location, dimensionId) {
        this.location = location;
        this.dimensionId = dimensionId;
        this.outputItemType = null;
    }
}

class GeneratorChannel {
    constructor(color) {
        this.color = color;
        this.hopperList = new Array();
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
    }
}

class GeneratorChannelMap {
    colors = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'light_blue',
        'blue', 'purple', 'pink', 'magenta', 'brown', 'black', 'white', 'light_gray', 'gray'];
    realtime = false;

    constructor() {
        for (const color of this.colors) {
            const channelJSON = world.getDynamicProperty(`${color}GeneratorChannel`);
            if (channelJSON) {
                this.resetAll();
                continue;
            }
            world.setDynamicProperty(`${color}GeneratorChannel`, JSON.stringify(new GeneratorChannel(color)));
        }
    }

    forEach(callback) {
        for (const color of this.colors) {
            const channel = this.getChannel(color);
            callback(channel);
        }
    }

    includes(hopper) {
        for (const color of this.colors) {
            const channel = this.getChannel(color);
            if (channel.hopperList.find(hopperGenerator => 
                hopperGenerator.location.x === hopper.location.x
                && hopperGenerator.location.y === hopper.location.y
                && hopperGenerator.location.z === hopper.location.z
                && hopperGenerator.dimensionId === hopper.dimension.id
            )) return true;
        }
        return false;
    }

    getChannel(color) {
        const channelJSON = world.getDynamicProperty(`${color}GeneratorChannel`);
        if (!channelJSON) {
            const newChannel = new GeneratorChannel(color);
            world.setDynamicProperty(`${color}GeneratorChannel`, JSON.stringify(newChannel));
            return newChannel;
        }
        return JSON.parse(channelJSON);
    }

    setChannel(color, channel) {
        world.setDynamicProperty(`${color}GeneratorChannel`, JSON.stringify(channel));
    }

    removeChannel(color) {
        world.setDynamicProperty(`${color}GeneratorChannel`, JSON.stringify(new GeneratorChannel(color)));
    }

    addGenerator(color, hopper) {
        const channel = this.getChannel(color);
        if (this.includes(hopper)) return false;
        if (this.numHoppersInUse() === 0)
            this.resetAll();
        channel.hopperList.push(new HopperGenerator(hopper.location, hopper.dimension.id));
        this.setChannel(color, channel);
        return true;
    }

    numHoppersInUse() {
        let totalHoppers = 0;
        this.forEach(channel => {
            totalHoppers += channel.hopperList.length;
        });
        return totalHoppers;
    }

    removeGenerator(color, hopper) {
        const channel = this.getChannel(color);
        channel.hopperList = channel.hopperList.filter(hopperGenerator => 
            hopperGenerator.location.x !== hopper.location.x ||
            hopperGenerator.location.y !== hopper.location.y ||
            hopperGenerator.location.z !== hopper.location.z ||
            hopperGenerator.dimensionId !== hopper.dimension.id
        );
        system.runTimeout(() => {
            if (channel.hopperList.length === 0)
                this.removeChannel(color);
            else
                this.setChannel(color, channel);
        }, 0);
    }

    reset(color) {
        const channel = this.getChannel(color);
        channel.totalCount = 0;
        channel.itemMap = new Map();
        channel.startTickTime = system.currentTick;
        channel.startRealTime = Date.now();
        this.setChannel(color, channel);
    }

    resetAll() {
        for (const color of this.colors) 
            this.reset(color);
        
    }

    getQueryOutput(channel) {
        const realtimeText = this.realtime ? 'realtime: ' : '';
        const message = { rawtext: [
            { translate: 'commands.generator.query.channel', with: [
                formatColor(channel.color), 
                realtimeText, 
                String(this.getMinutesSinceStart(channel)), 
                String(channel.totalCount), 
                Utils.calculatePerTime(channel.totalCount, this.getDeltaTime(channel)) ]
            }] };
        for (const item of Object.keys(channel.itemMap)) 
            message.rawtext.push({ text: `\n §7- ${item}: ${getAllModeOutput(channel, item)}` });
        
        return message;
    }

    getDeltaTime(channel) {
        const millisecondsPerTick = 50.0;
        let deltaTicks;
        
        if (this.realtime) 
            deltaTicks = (Date.now() - channel.startRealTime) / millisecondsPerTick;
         else 
            deltaTicks = system.currentTick - channel.startTickTime;
        
        deltaTicks = Math.floor(deltaTicks / 8) * 8; // normalize to hopper speed
        return deltaTicks;
    }

    getMinutesSinceStart(channel) {
        const minutes = this.getDeltaTime(channel) / 1200;
        return minutes.toFixed(2);
    }
}

export default GeneratorChannelMap;