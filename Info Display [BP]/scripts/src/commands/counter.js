import Command from 'stickycore/command'
import Data from 'stickycore/data'
import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

const MAX_TIMEDCOUNT_LENGTH = 10;

class TimedCount {
    constructor(count) {
        this.count = count;
        this.time = Data.getAbsoluteTime();
    }
}

class HopperCounter {
    constructor(location, dimensionId) {
        this.location = location;
        this.dimensionId = dimensionId;
    }
}

class HopperCounterChannel {
    constructor(color) {
        this.color = color;
        this.list = new Array();
        this.mode = 'count';
        this.timedCountList = new Array(MAX_TIMEDCOUNT_LENGTH).fill(new TimedCount(0));
        this.countThisTick = 0;
        this.count = 0;
        this.itemsPerTime = '?/?';
    }
}

class HopperCounters {
    constructor() {
        const colors = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'light_blue', 
        'blue', 'purple', 'pink', 'magenta', 'brown', 'black', 'white', 'light_gray', 'gray'];
        for (const color of colors) {
            this[color] = new HopperCounterChannel(color);
        }
    }
}

mc.system.runInterval(() => {
    if (!mc.world.getDynamicProperty('hopperCounters')) return;

    const hopperCountersMap = getHopperCountersMap();
    for (const color in hopperCountersMap) {
        let channel = hopperCountersMap[color];
        if (!channel.list.length === 0) return;
        updateCount(channel);
        calculateItemsPerTime(channel);
    }
    mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
});

function updateCount(channel) {
    channel.countThisTick = 0;
    for (const hopperCounter of channel.list) {
        const hopper = mc.world.getDimension(hopperCounter.dimensionId).getBlock(hopperCounter.location);
        let hopperContainer;
        let itemSlot;

        if (!hopper) return;
        if (hopper.typeId !== 'minecraft:hopper') return removeCounter(undefined, channel, hopper);

        hopperContainer = hopper.getComponent('minecraft:inventory').container;
        itemSlot = hopperContainer?.getItem(0);
        if (!itemSlot) continue;
        channel.count += itemSlot.amount;
        channel.countThisTick += itemSlot.amount;
        hopperContainer.setItem(0, new mc.ItemStack('minecraft:air', 1));
    }
}

function calculateItemsPerTime(channel) {
    if (channel.countThisTick > 0) {
        channel.timedCountList.push(new TimedCount(channel.countThisTick));
        channel.timedCountList.shift();
    }
    if (Data.getAbsoluteTime() % 8 !== 0) return;
    const firstTimeOffset = channel.timedCountList[0].time % 8;
    const deltaTime = Data.getAbsoluteTime() - channel.timedCountList[0].time + firstTimeOffset;
    const ticksPerHour = 72000;
    let itemsPerHour = channel.timedCountList.reduce((sum, value) => sum + value.count, 0) / (deltaTime / ticksPerHour);
    let unit = 'hr';
    if (channel.mode === 'minutemode' && itemsPerHour > 60) {
        itemsPerHour /= 60;
        unit = 'min';
    }
    if (channel.mode === 'secondmode' && itemsPerHour > 3600) {
        itemsPerHour /= 3600;
        unit = 's';
    }
    channel.itemsPerTime = `${itemsPerHour.toFixed(1)}/${unit}`;
}

new Command()
    .setName('counter')
    .addArgument('string', 'color')
    .addArgument('string', 'action')
    .setCallback(counterCommand)
    .build()

new Command()
    .setName('ct')
    .addArgument('string', 'color')
    .addArgument('string', 'action')
    .setCallback(counterCommand)
    .build()

new Command()
    .setName('counters')
    .setCallback(countersCommand)
    .build()

new Command()
    .setName('cts')
    .setCallback(countersCommand)
    .build()

function counterCommand(sender, args) {
    if (!mc.world.getDynamicProperty('hopperCounters')) return sender.sendMessage('§cThe hopperCounters feature is disabled.');
    const { color, action } = args;
    switch (action) {
        case 'add':
            add(sender, color);
            break;
        case 'remove':
            remove(sender, color);
            break;
        case 'reset':
            reset(sender, color);
            break;
        case 'query':
            query(sender, color);
            break;
        case 'track':
            track(sender, color);
            break;
        case 'untrack':
            untrack(sender, color);
            break;
        case 'secondmode':
        case 'minutemode':
        case 'hourmode':
        case 'countmode':
            setMode(sender, color, action);
            break;
        default:
            sender.sendMessage('§cUsage: ./counter <color> <add|remove|reset|query|track|untrack|mode>');
            break;
    }
}

function add(sender, color) {
    const blockRaycastResult = Data.getLookingAtBlock(sender);
    if (blockRaycastResult?.block?.typeId !== 'minecraft:hopper') return sender.sendMessage('§cYou are not looking at a hopper!');
    const hopper = blockRaycastResult.block;

    const hopperCountersMap = getHopperCountersMap();
    const channel = hopperCountersMap[color];
    if (!channel) {
        sender.sendMessage(`§cInvalid color: ${color}. Please use one of the wool block colors.`);
        return false;
    }
    if (hopperInUse(hopperCountersMap, hopper)) return sender.sendMessage('§cThis hopper is already in use.');
    
    channel.list.push(new HopperCounter(hopper.location, hopper.dimension.id));

    mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
    sender.sendMessage(`§7Hopper Counter added: ${formatColor(color)}`);
}

function remove(sender, color) {
    if (color === 'all') {
        removeAllCounters();
        return sender.sendMessage(`§7All Hopper Counters removed.`);
    }

    const blockRaycastResult = Data.getLookingAtBlock(sender);
    const hopper = blockRaycastResult?.block;

    const hopperCountersMap = getHopperCountersMap();
    if (channelHasError(sender, hopperCountersMap, color)) return;
    let channel = hopperCountersMap[color];

    if (hopper) {
        if (!removeCounter(sender, channel, hopper)) return;
        mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
        return sender.sendMessage(`§7Removed the Hopper Counter you are looking at from: ${formatColor(color)}`);
    } else {
        hopperCountersMap[color] = new HopperCounterChannel(color);
    }

    mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
    sender.sendMessage(`§7Hopper Counter removed: ${formatColor(color)}`);
}

function reset(sender, color) {
    const hopperCountersMap = getHopperCountersMap();

    if (color === 'all') {
        for (const color in hopperCountersMap) {
            const channel = hopperCountersMap[color];
            channel.count = 0;
        }
        mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
        return sender.sendMessage(`§7All Hopper Counters reset to 0.`);
    }

    if (channelHasError(sender, hopperCountersMap, color)) return;
    const channel = hopperCountersMap[color];

    channel.count = 0;
    mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
    sender.sendMessage(`§7Hopper Counter reset to 0: ${formatColor(color)}`);
}

function query(sender, color) {
    const hopperCounters = getHopperCountersMap();
    if (channelHasError(sender, hopperCounters, color)) return;
    const channel = hopperCounters[color];

    sender.sendMessage(`§7Hopper Counter ${formatColor(color)}§7: ${getModeOutput(channel)}`);
}

function track(sender, color) {
    const hopperCountersMap = getHopperCountersMap();
    if (color === 'all') return trackAll(sender, hopperCountersMap);

    const trackedChannelsList = getTrackedChannelsList(sender);
    if (trackedChannelsList.includes(color)) return sender.sendMessage(`§cHopper Counter ${formatColor(color)}§c is already being tracked.`);
    trackedChannelsList.push(color);
    
    sender.setDynamicProperty('trackedHopperCounterColors', JSON.stringify(trackedChannelsList));
    sender.sendMessage(`§7Hopper Counter ${formatColor(color)}§7 is now being tracked in the InfoDisplay.`);
}

function untrack(sender, color) {
    const trackedHopperCountersList = getTrackedChannelsList(sender);
    if (!trackedHopperCountersList) return sender.sendMessage(`§7There are no hopper counters being tracked.`);
    if (color === 'all') return untrackAll(sender);

    const index = trackedHopperCountersList.indexOf(color);
    if (index === -1) return sender.sendMessage(`§cHopper Counter ${formatColor(color)}§c is not being tracked.`);
    trackedHopperCountersList.splice(index, 1);

    sender.setDynamicProperty('trackedHopperCounterColors', JSON.stringify(trackedHopperCountersList));
    sender.sendMessage(`§7Hopper Counter ${formatColor(color)}§7 is no longer being tracked in the InfoDisplay.`);
}

function countersCommand(sender) {
    if (!mc.world.getDynamicProperty('hopperCounters')) return sender.sendMessage('§cThe hopperCounters feature is disabled.');
    const hopperCountersMap = getHopperCountersMap();

    let outputMessage = '§7Hopper Counters:';
    for (const color in hopperCountersMap) {
        const channel = hopperCountersMap[color];
        if (channel.list.length === 0) continue;
        outputMessage += `\n §7- ${formatColor(color)}§7: §r${channel.count}, ${channel.itemsPerTime}`;
    }
    
    if (outputMessage === '§7Hopper Counters:') return sender.sendMessage('§7There are no hopper counters in use.');
    sender.sendMessage(outputMessage);
}

function trackAll(sender, hopperCountersMap) {
    const trackedChannelsList = Object.keys(hopperCountersMap).filter(color => hopperCountersMap[color].list.length > 0);
    if (!trackedChannelsList) return sender.sendMessage(`§cThere are no hopper counters in use.`);
    sender.setDynamicProperty('trackedHopperCounterColors', JSON.stringify(trackedChannelsList));
    return sender.sendMessage(`§7All hopper counters are now being tracked in the InfoDisplay.`);
}

function untrackAll(sender) {
    sender.setDynamicProperty('trackedHopperCounterColors', JSON.stringify([]));
    sender.sendMessage(`§7All hopper counters are no longer being tracked in the InfoDisplay.`);
}

function setMode(sender, color, mode) {
    const hopperCountersMap = getHopperCountersMap();
    if (channelHasError(sender, hopperCountersMap, color)) return;
    const channel = hopperCountersMap[color];

    channel.mode = mode;
    mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
    sender.sendMessage(`§7Hopper Counter ${formatColor(color)}§7 mode: ${mode}`);
}

function channelHasError(sender, hopperCountersMap, color) {
    const channel = hopperCountersMap[color];
    if (!channel) {
        sender.sendMessage(`§cInvalid color: ${color}. Please use one of the wool block colors.`);
        return true;
    }
    if (channel.list.length === 0) {
        sender.sendMessage(`§cHopper Counter ${formatColor(color)}§c is not in use.`);
        return true;
    }
    return false;
}

function getHopperCountersMap() {
    const hopperCountersMapJSON = mc.world.getDynamicProperty('hopperCounterMap');
    if (!hopperCountersMapJSON) {
        mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(new HopperCounters()));
        return getHopperCountersMap();
    }
    const hopperCountersMap = JSON.parse(hopperCountersMapJSON);
    return hopperCountersMap;
}

function hopperInUse(hopperCountersMap, hopper) {
    for (const color in hopperCountersMap) {
        const channel = hopperCountersMap[color];
        if (channel.list.find(hopperCounter => 
            hopperCounter.location.x === hopper.location.x
            && hopperCounter.location.y === hopper.location.y
            && hopperCounter.location.z === hopper.location.z
            && hopperCounter.dimensionId === hopper.dimension.id
        )) return true;
    }
    return false;
}

function removeCounter(sender = undefined, channel, hopper) {
    let index = channel.list.findIndex(hopperCounter => 
        hopperCounter.location.x == hopper.location.x
        && hopperCounter.location.y == hopper.location.y
        && hopperCounter.location.z == hopper.location.z
        && hopperCounter.dimensionId == hopper.dimension.id
    );
    if (index === -1 && sender) sender.sendMessage(`§cThis hopper is not a part of Hopper Counter: ${formatColor(channel.color)}`);
    if (index === -1) return false;
    channel.list.splice(index, 1);
    return true;
}

export function removeAllCounters() {
    const hopperCountersMap = getHopperCountersMap();
    for (const color in hopperCountersMap) {
        hopperCountersMap[color] = new HopperCounterChannel(color);
    }
    mc.world.setDynamicProperty('hopperCounterMap', JSON.stringify(hopperCountersMap));
}

export function getTrackedChannelsList(sender) {
    const trackedChannelsJSON = sender.getDynamicProperty('trackedHopperCounterColors');
    if (!trackedChannelsJSON) {
        sender.setDynamicProperty('trackedHopperCounterColors', JSON.stringify([]));
        return getTrackedChannelsList(sender);
    }
    const trackedChannels = JSON.parse(trackedChannelsJSON);
    return trackedChannels;
}

export function formatColor(color) {
    return `${Utils.getColorCode(color)}${color}§r`;
}

export function getModeOutput(channel) {
    if (channel.mode !== 'countmode') return channel.itemsPerTime;
    return channel.count;
}

export function getChannelFormatted(color) {
    const hopperCountersMap = getHopperCountersMap();
    const channel = hopperCountersMap[color];
    if (channel.list.length === 0) return "N/A";
    return channel;
}
