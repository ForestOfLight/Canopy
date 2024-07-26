import { system, world, ItemStack } from '@minecraft/server'
import Command from 'stickycore/command'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

class HopperCounter {
    constructor(location, dimensionId) {
        this.location = location;
        this.dimensionId = dimensionId;
    }
}

class CounterChannel {
    constructor(color) {
        this.color = color;
        this.hopperList = new Array();
        this.mode = 'countMode';
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = Data.getAbsoluteTime();
        this.startRealTime = Date.now();
    }
}

class CounterChannelMap {
    colors = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'light_blue',
        'blue', 'purple', 'pink', 'magenta', 'brown', 'black', 'white', 'light_gray', 'gray'];
    realtime = false;

    constructor() {
        for (const color of this.colors) {
            const channelJSON = world.getDynamicProperty(`${color}CounterChannel`);
            if (channelJSON) {
                this.resetAll();
                continue;
            }
            world.setDynamicProperty(`${color}CounterChannel`, JSON.stringify(new CounterChannel(color)));
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
            if (channel.hopperList.find(hopperCounter => 
                hopperCounter.location.x === hopper.location.x
                && hopperCounter.location.y === hopper.location.y
                && hopperCounter.location.z === hopper.location.z
                && hopperCounter.dimensionId === hopper.dimension.id
            )) return true;
        }
        return false;
    }

    getChannel(color) {
        const channelJSON = world.getDynamicProperty(`${color}CounterChannel`);
        if (!channelJSON) {
            const newChannel = new CounterChannel(color);
            world.setDynamicProperty(`${color}CounterChannel`, JSON.stringify(newChannel));
            return newChannel;
        }
        return JSON.parse(channelJSON);
    }

    setChannel(color, channel) {
        world.setDynamicProperty(`${color}CounterChannel`, JSON.stringify(channel));
    }

    removeChannel(color) {
        world.setDynamicProperty(`${color}CounterChannel`, JSON.stringify(new CounterChannel(color)));
    }

    addCounter(color, hopper) {
        const channel = this.getChannel(color);
        if (this.includes(hopper)) return false;
        channel.hopperList.push(new HopperCounter(hopper.location, hopper.dimension.id));
        this.setChannel(color, channel);
        return true;
    }

    removeCounter(color, hopper) {
        const channel = this.getChannel(color);
        channel.hopperList = channel.hopperList.filter(hopperCounter => 
            hopperCounter.location.x !== hopper.location.x ||
            hopperCounter.location.y !== hopper.location.y ||
            hopperCounter.location.z !== hopper.location.z ||
            hopperCounter.dimensionId !== hopper.dimension.id
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
        channel.startTickTime = Data.getAbsoluteTime();
        channel.startRealTime = Date.now();
        this.setChannel(color, channel);
    }

    resetAll() {
        for (const color of this.colors) {
            this.reset(color);
        }
    }

    setMode(color, mode) {
        const channel = this.getChannel(color);
        channel.mode = mode;
        this.setChannel(color, channel);
    }

    getQueryOutput(channel) {
        let realtimeText = this.realtime ? 'realtime: ' : '';
        let output = `§7Items for ${formatColor(channel.color)}§7 (${realtimeText}${this.getMinutesSinceStart(channel)} min.), total: §f${channel.totalCount}§7, (§f${Utils.calculatePerTime(channel.totalCount, this.getDeltaTime(channel), channel.mode)}§7):`;
        for (const item of Object.keys(channel.itemMap)) {
            const count = channel.itemMap[item];
            output += `\n §7- ${item}: ${getAllModeOutput(channel, item)}`;
        }
        return output;
    }

    getDeltaTime(channel) {
        const msPerTick = 50.0;
        let deltaTime;
        
        if (this.realtime) {
            deltaTime = (Date.now() - channel.startRealTime) / msPerTick;
        } else {
            deltaTime = Data.getAbsoluteTime() - channel.startTickTime;
        }
        deltaTime = Math.floor(deltaTime / 8) * 8;
        return deltaTime;
    }

    getMinutesSinceStart(channel) {
        const minutes = this.getDeltaTime(channel) / 1200;
        return minutes.toFixed(2);
    }
}

const channelMap = new CounterChannelMap();
const validModes = ['countMode', 'perhourMode', 'perminuteMode', 'persecondMode'];

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    if ((event.block.typeId !== 'minecraft:hopper' 
        && !event.block.typeId.slice(-4) === 'wool')
        || !world.getDynamicProperty('hopperCounters')) return;
    tryCreateCounter(event.block);
});

function tryCreateCounter(block) {
    if (block.typeId === 'minecraft:hopper') {
        const potentialWool = getHopperFacingBlock(block);
        if (potentialWool?.typeId?.slice(-4) === 'wool') {
            const color = potentialWool.typeId.replace('minecraft:', '').replace('_wool', '');
            channelMap.addCounter(color, block);
        }
    } else if (block.typeId.slice(-4) === 'wool') {
        const adjacentBlocks = [block.above(), block.north(), block.south(), block.west(), block.east()];
        for (const adjacentBlock of adjacentBlocks) {
            if (adjacentBlock?.typeId === 'minecraft:hopper' && getHopperFacingBlock(adjacentBlock)?.typeId === block.typeId) {
                const color = block.typeId.replace('minecraft:', '').replace('_wool', '');
                channelMap.addCounter(color, adjacentBlock);
            }
        }
    }
}

system.runInterval(() => {
    if (!world.getDynamicProperty('hopperCounters')) return;
    channelMap.forEach(channel => {
        if (channel.hopperList.length === 0) return;
        updateCount(channel);
        world.setDynamicProperty(`${channel.color}CounterChannel`, JSON.stringify(channel));
    });
});

function updateCount(channel) {
    for (const hopperCounter of channel.hopperList) {
        const hopper = world.getDimension(hopperCounter.dimensionId).getBlock(hopperCounter.location);

        if (!hopper) return; // hopper is unloaded
        if (hopper.typeId !== 'minecraft:hopper' || getHopperFacingBlock(hopper)?.typeId !== `minecraft:${channel.color}_wool`)
            return channelMap.removeCounter(channel.color, hopper);

        const hopperContainer = hopper.getComponent('minecraft:inventory').container;
        const itemStack = hopperContainer?.getItem(0);
        if (!itemStack) continue;
        const itemType = itemStack.typeId.replace('minecraft:', '');
        channel.itemMap[itemType] = (channel.itemMap[itemType] || 0) + itemStack.amount;
        channel.totalCount += itemStack.amount;
        hopperContainer.setItem(0, new ItemStack('minecraft:air', 1));
    }
}

new Command()
    .setName('counter')
    .addArgument('string', 'argOne')
    .addArgument('string', 'argTwo')
    .setCallback(counterCommand)
    .build()

new Command()
    .setName('ct')
    .addArgument('string', 'argOne')
    .addArgument('string', 'argTwo')
    .setCallback(counterCommand)
    .build()

function counterCommand(sender, args) {
    if (!world.getDynamicProperty('hopperCounters')) return sender.sendMessage('§cThe hopperCounters feature is disabled.');
    const { argOne, argTwo } = args;

    if (!channelMap.colors.includes(argOne) && argOne !== 'reset' && argOne !== 'realtime' && argOne !== 'all' && validModes.includes(argTwo)) {
        return sender.sendMessage(`§cInvalid color: ${argOne}. Please use one of the wool block colors.`);
    }

    if (argOne === 'reset')
        resetAll(sender);
    else if (argOne === 'realtime')
        realtimeQueryAll(sender);
    else if (channelMap.colors.includes(argOne) && !argTwo)
        query(sender, argOne);
    else if (!argOne && !argTwo || argOne === 'all' && !argTwo)
        queryAll(sender);
    else if (argOne && argTwo === 'realtime')
        realtimeQuery(sender, argOne);
    else if (argOne && argTwo === 'reset')
        reset(sender, argOne);
    else if (argOne && argTwo && argOne !== 'all')
        setMode(sender, argOne, argTwo);
    else if (argOne === 'all' && argTwo)
        setAllMode(sender, argTwo);
    else
        sender.sendMessage('§cUsage: ./counter <color/all/reset/realtime> [add/remove/mode/realtime]');
}

function reset(sender, color) {
    channelMap.reset(color);
    sender.sendMessage(`§7Reset and time restarted: ${formatColor(color)}`);
    Utils.broadcastActionBar(`${sender.name}: reset ${formatColor(color)} hopper counter`, sender);
}

function resetAll(sender) {
    channelMap.resetAll();
    sender.sendMessage(`§7All channels have been reset and hopper counter timer started.`);
    Utils.broadcastActionBar(`${sender.name}: reset all hopper counters`, sender);
}

function realtimeQuery(sender, color) {
    channelMap.realtime = true;
    query(sender, color);
    channelMap.realtime = false;
}

function realtimeQueryAll(sender) {
    channelMap.realtime = true;
    queryAll(sender);
    channelMap.realtime = false;
}

function query(sender, color) {
    const channel = channelMap.getChannel(color);
    sender.sendMessage(channelMap.getQueryOutput(channel));
}

function queryAll(sender) {
    let output = '';
    channelMap.forEach(channel => {
        if (channel.hopperList.length === 0) return;
        output += channelMap.getQueryOutput(channel) + '\n';
    });
    
    if (output === '') output = '§7There are no hopper counters in use.';
    sender.sendMessage(output);
}

function setMode(sender, color, mode) {
    if (!validModes.includes(mode))
        return sender.sendMessage(`§cInvalid mode. Please use one of the following modes: ${validModes.join(', ')}`);

    if (!channelMap.colors.includes(color))
        return sender.sendMessage(`§cInvalid color: ${color}. Please use one of the wool block colors.`);

    channelMap.setMode(color, mode);
    sender.sendMessage(`§7Hopper Counter ${formatColor(color)}§7 mode: ${mode}`);
    Utils.broadcastActionBar(`${sender.name}: set ${formatColor(color)} hopper counter mode to ${mode}`, sender);
}

function setAllMode(sender, mode) {
    if (!validModes.includes(mode))
        return sender.sendMessage(`§cInvalid mode. Please use one of the following modes: ${validModes.join(', ')}`);
    
    channelMap.forEach(channel => {
        channelMap.setMode(channel.color, mode);
    });
    sender.sendMessage(`§7All Hopper Counters mode: ${mode}`);
    Utils.broadcastActionBar(`${sender.name}: set all hopper counters mode to ${mode}`, sender);
}

function getHopperFacingBlock(hopper) {
    const facing = hopper.permutation.getState("facing_direction");
    switch (facing) {
        case 0: return hopper.below();
        case 2: return hopper.north();
        case 3: return hopper.south();
        case 4: return hopper.west();
        case 5: return hopper.east();
        default: return undefined;
    }
}

function getActiveColorsList() {
    return channelMap.colors.filter(color => {
        const channel = channelMap.getChannel(color);
        return channel.hopperList.length > 0;
    });
}

function formatColor(color) {
    return `${Utils.getColorCode(color)}${color}§r`;
}

function getModeOutput(channel) {
    if (channel.mode !== 'countMode') return Utils.calculatePerTime(channel.totalCount, channelMap.getDeltaTime(channel), channel.mode);
    return channel.totalCount;
}

function getAllModeOutput(channel, item) {
    let output = '';
    let rateModes = validModes.filter(mode => mode !== 'countMode');

    if (channel.mode === 'countMode')
        output += `${Utils.getColorCode(channel.color)}${channel.itemMap[item]}`;
    else
        output += `§f${channel.itemMap[item]}`;
    for (let i = 0; i < rateModes.length; i++) {
        if (i === 0) output += ' §7(';
        else output += '§7, ';
        if (rateModes[i] === channel.mode)
            output += `${Utils.getColorCode(channel.color)}`;
        output += `${Utils.calculatePerTime(channel.itemMap[item], channelMap.getDeltaTime(channel), rateModes[i])}`;
    }
    output += '§7)';
    return output;

}

export function getInfoDisplayOutput() {
    const activeChannels = getActiveColorsList();
	let output = '';
    let hopperCounterOutput;
	
	if (activeChannels?.length === 0) return '';
	if (activeChannels.length <= 4) {
		output += 'Counters: ';
	}
	for (let i = 0; i < activeChannels.length; i++) {
		const color = activeChannels[i];
		if (i != 0 && (i % 4) == 0) output += '\n';
		const channel = channelMap.getChannel(color);
		if (channel.hopperList.length === 0) {
			output += `${Utils.getColorCode(color)}N/A§r `;
			continue;
		}
        hopperCounterOutput = getModeOutput(channel);
		output += `${Utils.getColorCode(color)}${hopperCounterOutput}§r `;
	}
	output += '\n';
    return output;
}

export function resetCounterMap() {
    for (const color in channelMap.colors) {
        channelMap.removeChannel(color);
    }
}

export { channelMap, formatColor, query, queryAll };