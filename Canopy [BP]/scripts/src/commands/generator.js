import { ItemStack, system, world } from '@minecraft/server'
import { Rule, Command } from 'lib/canopy/Canopy'
import GeneratorChannelMap from 'src/classes/HopperGenerators'
import Utils from 'include/utils'

new Rule({
    category: 'Rules',
    identifier: 'hopperGenerators',
    description: { translate: 'rules.hopperGenerators' }
})

const cmd = new Command({
    name: 'generator',
    description: { translate: 'commands.generator' },
    usage: 'generator <color/all/reset/realtime> [reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: generatorCommand,
    contingentRules: ['hopperGenerators'],
    helpEntries: [
        { usage: 'generator <color>', description: { translate: 'commands.generator.query' } },
        { usage: 'generator [color] realtime', description: { translate: 'commands.generator.realtime' } },
        { usage: 'generator [color] reset', description: { translate: 'commands.generator.reset' } }
    ]
})

new Command({
    name: 'gt',
    description: { translate: 'commands.generator' },
    usage: 'gt <color/all/reset/realtime> [reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: generatorCommand,
    contingentRules: ['hopperGenerators'],
    helpHidden: true
})

const channelMap = new GeneratorChannelMap();

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    if ((event.block.typeId !== 'minecraft:hopper' 
        && !event.block.typeId.slice(-4) === 'wool')
        || !world.getDynamicProperty('hopperGenerators')) return;
    tryCreateGenerator(event.block);
});

function tryCreateGenerator(block) {
    if (block.typeId === 'minecraft:hopper') {
        const potentialWool = block.above();
        if (potentialWool?.typeId?.slice(-4) === 'wool') {
            const color = potentialWool.typeId.replace('minecraft:', '').replace('_wool', '');
            channelMap.addGenerator(color, block);
        }
    } else if (block.typeId.slice(-4) === 'wool') {
        const potentialHopper = block.below();
        if (potentialHopper?.typeId === 'minecraft:hopper') {
            const color = block.typeId.replace('minecraft:', '').replace('_wool', '');
            channelMap.addGenerator(color, potentialHopper);
        }
    }
}

system.runInterval(() => {
    if (!world.getDynamicProperty('hopperGenerators')) return;
    channelMap.forEach(channel => {
        if (channel.hopperList.length === 0) return;
        removeDestroyedGenerators(channel);
        const generatedItems = generateItems(channel);
        updateCount(channel, generatedItems);
        world.setDynamicProperty(`${channel.color}GeneratorChannel`, JSON.stringify(channel));
    });
});

function removeDestroyedGenerators(channel) {
    for (const hopperGenerator of channel.hopperList) {
        const hopper = world.getDimension(hopperGenerator.dimensionId).getBlock(hopperGenerator.location);
        if (!hopper) continue;
        if (hopper.typeId !== 'minecraft:hopper' || hopper.above()?.typeId !== `minecraft:${channel.color}_wool`)
            channelMap.removeGenerator(channel.color, hopper);
    }
}

function generateItems(channel) {
    const generatedItems = [];
    for (const hopperGenerator of channel.hopperList) {
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

function updateCount(channel, generatedItems) {
    for (const itemType of generatedItems) {
        const itemName = itemType.replace('minecraft:', '');
        channel.itemMap[itemName] = (channel.itemMap[itemName] || 0) + 1;
        channel.totalCount++;
    }
}

function generatorCommand(sender, args) {
    const { argOne, argTwo } = args;

    if (argOne !== null && !channelMap.colors.includes(argOne) && argOne !== 'reset' && argOne !== 'realtime' && argOne !== 'all') 
        return sender.sendMessage({ translate: 'commands.generator.channel.notfound', with: [argOne] });
    

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
    else
        cmd.sendUsage(sender);
}

function reset(sender, color) {
    channelMap.reset(color);
    sender.sendMessage({ translate: 'commands.generator.reset.single', with: [formatColor(color)] });
    Utils.broadcastActionBar({ translate: 'commands.generator.reset.single.actionbar', with: [sender.name, formatColor(color)]}, sender);
}

function resetAll(sender) {
    channelMap.resetAll();
    sender.sendMessage({ translate: 'commands.generator.reset.all' });
    Utils.broadcastActionBar({ translate: 'commands.generator.reset.all.actionbar', with: [sender.name] }, sender);
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
    
    if (message.rawtext.length === 0)
        message = { translate: 'commands.generator.query.empty' };
    sender?.sendMessage(message);
}

function formatColor(color) {
    return `${Utils.getColorCode(color)}${color}§r`;
}

function getAllModeOutput(channel, item) {
    let output = '';
    const rateModes = ['perhourMode', 'perminuteMode', 'persecondMode'];

    output += `${Utils.getColorCode(channel.color)}${channel.itemMap[item]}`;
    for (let i = 0; i < rateModes.length; i++) {
        if (i === 0) output += ' §7(';
        else output += '§7, ';
        output += `${Utils.calculatePerTime(channel.itemMap[item], channelMap.getDeltaTime(channel), rateModes[i])}`;
    }
    output += '§7)';
    return output;
}

export function resetGeneratorMap() {
    for (const color in channelMap.colors) 
        channelMap.removeChannel(color);
    
}

export { channelMap, formatColor, query, queryAll, getAllModeOutput };