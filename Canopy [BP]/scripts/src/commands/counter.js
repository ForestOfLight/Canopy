import { system, world, ItemStack } from '@minecraft/server'
import { Rule, Command } from 'lib/canopy/Canopy'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

new Rule({
    category: 'Rules',
    identifier: 'hopperCounters',
    description: { translate: 'rules.hopperCounters' }
})

const cmd = new Command({
    name: 'counter',
    description: { translate: 'commands.counter' },
    usage: 'counter <color/all/reset/realtime> [mode/reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpEntries: [
        { usage: 'counter <color>', description: { translate: 'commands.counter.query' } },
        { usage: 'counter [color] realtime', description: { translate: 'commands.counter.realtime' } },
        { usage: 'counter <color/all> <mode>', description: { translate: 'commands.counter.mode' } },
        { usage: 'counter [color] reset', description: { translate: 'commands.counter.reset' } }
    ]
})

new Command({
    name: 'ct',
    description: { translate: 'commands.counter' },
    usage: 'ct <color/all/reset/realtime> [mode/reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpHidden: true
})

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
        let message = { rawtext: [
            { translate: 'commands.counter.query.channel', with: [
                formatColor(channel.color), 
                realtimeText, 
                String(this.getMinutesSinceStart(channel)), 
                String(channel.totalCount), 
                Utils.calculatePerTime(channel.totalCount ,this.getDeltaTime(channel), channel.mode) ]
            }] };
        for (const item of Object.keys(channel.itemMap)) {
            message.rawtext.push({ text: `\n §7- ${item}: ${getAllModeOutput(channel, item)}` });
        }
        return message;
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
        const potentialHoppers = [block.above(), block.north(), block.south(), block.west(), block.east()];
        for (const potentialHopper of potentialHoppers) {
            if (potentialHopper?.typeId === 'minecraft:hopper' && getHopperFacingBlock(potentialHopper)?.typeId === block.typeId) {
                const color = block.typeId.replace('minecraft:', '').replace('_wool', '');
                channelMap.addCounter(color, potentialHopper);
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

        if (!hopper) return;
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

function counterCommand(sender, args) {
    const { argOne, argTwo } = args;

    if (!channelMap.colors.includes(argOne) && argOne !== 'reset' && argOne !== 'realtime' && argOne !== 'all' && validModes.includes(argTwo)) {
        return sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [argOne] });
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
        cmd.sendUsage(sender);
}

function reset(sender, color) {
    channelMap.reset(color);
    sender.sendMessage({ translate: 'commands.counter.reset.single', with: [formatColor(color)] });
    Utils.broadcastActionBar({ translate: 'commands.counter.reset.single.actionbar', with: [sender.name, formatColor(color)]}, sender);
}

function resetAll(sender) {
    channelMap.resetAll();
    sender.sendMessage({ translate: 'commands.counter.reset.all' });
    Utils.broadcastActionBar({ translate: 'commands.counter.reset.all.actionbar', with: [sender.name] }, sender);
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
    sender?.sendMessage(channelMap.getQueryOutput(channel));
}

function queryAll(sender) {
    let message = { rawtext: [] };
    channelMap.forEach(channel => {
        if (channel.hopperList.length === 0) return;
        message.rawtext.push({ rawtext: [channelMap.getQueryOutput(channel), { text: '\n' }] });
    });
    
    if (message == { rawtext: [] })
        message = { translate: 'commands.counter.query.empty' };
    sender?.sendMessage(message);
}

function setMode(sender, color, mode) {
    if (!validModes.includes(mode))
        return sender.sendMessage({ translate: 'commands.counter.mode.notfound', with: [mode, validModes.join(', ')] });

    if (!channelMap.colors.includes(color))
        return sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [color] });

    channelMap.setMode(color, mode);
    sender.sendMessage({ translate: 'commands.counter.mode.single.success', with: [formatColor(color), mode] });
    Utils.broadcastActionBar({ translate: 'commands.counter.mode.single.success.actionbar', with: [sender.name, formatColor(color), mode] }, sender);
}

function setAllMode(sender, mode) {
    if (!validModes.includes(mode))
        return sender.sendMessage({ translate: 'commands.counter.mode.notfound', with: [mode, validModes.join(', ')] });
    
    channelMap.forEach(channel => {
        channelMap.setMode(channel.color, mode);
    });
    sender.sendMessage({ translate: 'commands.counter.mode.all.success', with: [mode] });
    Utils.broadcastActionBar({ translate: 'commands.counter.mode.all.success.actionbar', with: [sender.name, mode] }, sender);
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
    if (channel.mode !== 'countMode')
        return Utils.calculatePerTime(channel.totalCount, channelMap.getDeltaTime(channel), channel.mode);
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
		if (i != 0 && (i % 4) == 0)
            output += '\n';
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