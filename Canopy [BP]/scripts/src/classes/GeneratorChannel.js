import { system, world, ItemStack } from "@minecraft/server";
import Utils from "../../include/utils";

class GeneratorChannel {
    constructor(color) {
        this.color = color;
        this.hopperList = new Array();
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
        world.setDynamicProperty(`${color}GeneratorChannel`, JSON.stringify(this));
    }

    getData() {
        const channelJSON = world.getDynamicProperty(`${this.color}GeneratorChannel`);
        if (!channelJSON) 
            throw new Error(`No channel found for color ${this.color}`);
        return JSON.parse(channelJSON);
    }

    setData(channelData) {
        world.setDynamicProperty(`${this.color}GeneratorChannel`, JSON.stringify(channelData));
    }

    updateData() {
        world.setDynamicProperty(`${this.color}GeneratorChannel`, JSON.stringify(this));
    }

    reset() {
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
        world.setDynamicProperty(`${this.color}GeneratorChannel`, JSON.stringify(this));
    }

    includes(hopper) {
        const channel = this.getData();
        return channel.hopperList.find(hopperGenerator => 
            hopperGenerator.location.x === hopper.location.x
            && hopperGenerator.location.y === hopper.location.y
            && hopperGenerator.location.z === hopper.location.z
            && hopperGenerator.dimensionId === hopper.dimension.id
        );
    }

    addGenerator(hopper) {
        if (this.hopperList.length === 0)
            this.reset();
        if (this.includes(hopper))
            throw new Error(`Hopper already exists in channel ${this.color}`);
        this.hopperList.push({ 
            location: hopper.location, 
            dimensionId: hopper.dimension.i,
            outputItemType: null
        });
        this.updateData();
        return true;
    }

    removeGenerator(hopper) {
        this.hopperList = this.hopperList.filter(hopperGenerator => 
            hopperGenerator.location.x !== hopper.location.x ||
            hopperGenerator.location.y !== hopper.location.y ||
            hopperGenerator.location.z !== hopper.location.z ||
            hopperGenerator.dimensionId !== hopper.dimension.id
        );
        system.runTimeout(() => {
            if (this.hopperList.length === 0)
                this.reset();
            else
                this.updateData();
        }, 0);
    }

    getQueryOutput(useRealTime = false) {
        const realtimeText = useRealTime ? 'realtime: ' : '';
        const message = { rawtext: [
            { translate: 'commands.generator.query.channel', with: [
                Utils.formatColorStr(this.color),
                realtimeText, 
                String(this.getMinutesSinceStart(this)), 
                String(this.totalCount), 
                Utils.calculatePerTime(this.totalCount, this.getDeltaTime()) ]
            }
        ]};
        for (const item of Object.keys(this.itemMap))
            message.rawtext.push({ text: `\n §7- ${item}: ${this.getAllModeOutput(item)}` });
        return message;
    }

    getAllModeOutput(item) {
        let output = '';
        const rateModes = ['perhourMode', 'perminuteMode', 'persecondMode'];
    
        output += `${Utils.getColorCode(this.color)}${this.itemMap[item]}`;
        for (let i = 0; i < rateModes.length; i++) {
            if (i === 0) output += ' §7(';
            else output += '§7, ';
            output += `${Utils.calculatePerTime(this.itemMap[item], this.getDeltaTime(), rateModes[i])}`;
        }
        output += '§7)';
        return output;
    }

    getDeltaTime(useRealTime) {
        const millisecondsPerTick = 50.0;
        let deltaTicks;
        if (useRealTime)
            deltaTicks = (Date.now() - this.startRealTime) / millisecondsPerTick;
        else
            deltaTicks = system.currentTick - this.startTickTime;
        deltaTicks = Math.floor(deltaTicks / 8) * 8; // normalize to hopper speed
        return deltaTicks;
    }

    getMinutesSinceStart() {
        const minutes = this.getDeltaTime() / 1200;
        return minutes.toFixed(2);
    }

    removeDestroyedGenerators() {
        for (const hopperGenerator of this.hopperList) {
            const hopper = world.getDimension(hopperGenerator.dimensionId).getBlock(hopperGenerator.location);
            if (!hopper) continue;
            if (hopper.typeId !== 'minecraft:hopper' || hopper.above()?.typeId !== `minecraft:${this.color}_wool`)
                this.removeGenerator(hopper);
        }
    }
    
    generateItems() {
        const generatedItems = [];
        for (const hopperGenerator of this.hopperList) {
            const hopper = world.getDimension(hopperGenerator.dimensionId).getBlock(hopperGenerator.location);
            if (!hopper) continue;
            const hopperContainer = hopper.getComponent('minecraft:inventory').container;
            const itemStack = hopperContainer?.getItem(0);
            if (itemStack) {
                hopperGenerator.outputItemType = itemStack.typeId;
            } else {
                if (hopperGenerator.outputItemType === null)
                    continue;
                hopperContainer.setItem(0, new ItemStack(hopperGenerator.outputItemType));
                generatedItems.push(hopperGenerator.outputItemType);
            }
        }
        return generatedItems;
    }
    
    updateCount(generatedItems) {
        for (const itemType of generatedItems) {
            const itemName = itemType.replace('minecraft:', '');
            this.itemMap[itemName] = (this.itemMap[itemName] || 0) + 1;
            this.totalCount++;
        }
        this.updateData();
    }
}

export default GeneratorChannel;