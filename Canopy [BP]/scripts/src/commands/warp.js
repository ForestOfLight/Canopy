import { world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandWarp',
    description: { translate: 'rules.commandWarp' }
});

new Rule({
    category: 'Rules',
    identifier: 'commandWarpSurvival',
    description: { translate: 'rules.commandWarpSurvival' },
    contingentRules: ['commandWarp']
})

const cmd = new Command({
    name: 'warp',
    description: { translate: 'commands.warp' },
    usage: 'warp <add/remove/name> [name]',
    args: [
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'name' }
    ],
    callback: warpActionCommand,
    contingentRules: ['commandWarp'],
    helpEntries: [
        { usage: 'warp <add/remove> <name>', description: { translate: 'commands.warp.edit' } },
        { usage: 'warp <name>', description: { translate: 'commands.warp.tp' } }
    ]
});

new Command({
    name: 'w',
    description: { translate: 'commands.warp' },
    usage: 'w',
    args: [
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'name' }
    ],
    callback: warpActionCommand,
    contingentRules: ['commandWarp'],
    helpHidden: true
});

new Command({
    name: 'warps',
    description: { translate: 'commands.warp.list' },
    usage: 'warps',
    callback: warpListCommand,
    contingentRules: ['commandWarp']
});

class Warp {
    constructor(name, location, dimension) {
        this.name = name;
        this.location = location;
        this.dimension = dimension;
    }
}

class Warps {
    constructor() {
        this.warpList = new Map();
    }
}

async function warpActionCommand(sender, args) {
    if (!await Rule.getValue('commandWarpSurvival') && ['survival', 'adventure'].includes(sender.getGameMode()))
        return sender.sendMessage({ translate: 'commands.generic.blocked.survival' });

    let { action, name } = args;
    if (Number.isInteger(action)) action = action.toString();
    if (Number.isInteger(name)) name = name.toString();
    const warpMap = getWarpMapCopy();

    if (action === 'add') {
        addWarp(sender, name, warpMap);
    } else if (action === 'remove') {
        removeWarp(sender, name, warpMap);
    } else if (warpMap.has(action)) {
        name = action;
        warpTP(sender, name, warpMap);
    } else if (action !== null && !warpMap.has(action)) {
        sender.sendMessage({ translate: 'commands.warp.noexist', with: [action] });
    } else {
        cmd.sendUsage(sender);
    }
}

function addWarp(sender, name, warpMap) {
    if (warpMap.has(name)) return sender.sendMessage({ translate: 'commands.warp.exists', with: [name] });
    const { location, dimension } = sender;

    let warps = JSON.parse(world.getDynamicProperty('warps'));
    warps.warpList[name] = new Warp(name, location, dimension);
    world.setDynamicProperty(`warps`, JSON.stringify(warps));
    sender.sendMessage({ translate: 'commands.warp.add.success', with: [name] });
}

function removeWarp(sender, name, warpMap) {
    if (!warpMap.has(name))
        return sender.sendMessage({ translate: 'commands.warp.noexist', with: [name] });

    warpMap.delete(name);
    setWarpMap(warpMap);
    sender.sendMessage({ translate: 'commands.warp.remove.success', with: [name] });
}

function warpTP(sender, name, warpMap) {
    const warp = warpMap.get(name);

    if (warp === undefined)
        return sender.sendMessage({ translate: 'commands.warp.noexist', with: [name] });

    sender.teleport({ x: warp.location.x, y: warp.location.y, z: warp.location.z }, { dimension: world.getDimension(warp.dimension.id) });
    sender.sendMessage({ translate: 'commands.warp.tp.success', with: [name] });
}

function getWarpMapCopy() {
    let warps = world.getDynamicProperty('warps');
    if (warps === undefined || warps === false) {
        let initWarps = new Warps();
        world.setDynamicProperty(`warps`, JSON.stringify(initWarps));
        warps = world.getDynamicProperty('warps');
    }
    return new Map(Object.entries(JSON.parse(warps).warpList));
}

function setWarpMap(newWarpMap) {
    let warps = JSON.parse(world.getDynamicProperty('warps'));
    let newWarpList = {};

    for (let [key, value] of Object.entries(warps.warpList)) {
        if (!newWarpMap.has(key)) continue;
        newWarpList[key] = newWarpMap.get(key);
    }
    warps.warpList = newWarpList;
    world.setDynamicProperty(`warps`, JSON.stringify(warps));
}

async function warpListCommand(sender) {
    if (!await Rule.getValue('commandWarpSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage({ translate: 'commands.generic.blocked.survival' });
    
    let warpMap = getWarpMapCopy();

    if (warpMap.size === 0)
        return sender.sendMessage({ translate: 'commands.warp.list.empty' });
    const message = { rawtext: [{ translate: 'commands.warp.list.header' }] };
    warpMap.forEach((currWarp) => {
        message.rawtext.push({ text: `\n§7- ${currWarp.name}` });
    });

    sender.sendMessage(message);
}
