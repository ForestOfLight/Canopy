import { world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    identifier: 'commandWarp',
    description: 'Allows the use of the warp command.'
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

const cmd = new Command({
    name: 'warp',
    description: 'Teleport to and manage warps.',
    usage: 'warp <name> or warp <add/remove> <name>',
    args: [
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'name' }
    ],
    callback: warpActionCommand,
    contingentRules: ['commandWarp']
});

new Command({
    name: 'w',
    description: 'Teleport to and manage warps.',
    usage: 'w <name> or w <add/remove> <name>',
    args: [
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'name' }
    ],
    callback: warpActionCommand,
    contingentRules: ['commandWarp']
});

new Command({
    name: 'warps',
    description: 'List all available warps.',
    callback: warpListCommand,
    contingentRules: ['commandWarp']
});

function warpActionCommand(sender, args) {
    if (!world.getDynamicProperty('commandWarpSurvival') && ['survival', 'adventure'].includes(sender.getGameMode()))
        return sender.sendMessage('§cThe commandWarpSurvival feature is disabled in survival mode.');

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
        sender.sendMessage(`§cWarp "${action}" not found. Use ./warps to see the list of warps.`);
    } else {
        cmd.sendUsage(sender);
    }
}

function addWarp(sender, name, warpMap) {
    if (warpMap.has(name)) return sender.sendMessage(`§cWarp "${name}" already exists. Use ./warps to see the list of warps.`);
    
    const { location, dimension } = sender;

    let warps = JSON.parse(world.getDynamicProperty('warps'));
    warps.warpList[name] = new Warp(name, location, dimension);
    world.setDynamicProperty(`warps`, JSON.stringify(warps));
    sender.sendMessage(`§7Warp "${name}" has been added.`);
}

function removeWarp(sender, name, warpMap) {
    if (!warpMap.has(name)) return sender.sendMessage(`§cWarp "${name}" not found. Use ./warps to see the list of warps.`);

    warpMap.delete(name);
    setWarpMap(warpMap);
    sender.sendMessage(`§7Warp "${name}" has been removed.`);
}

function warpTP(sender, name, warpMap) {
    const warp = warpMap.get(name);

    if (warp === undefined) return sender.sendMessage(`§cWarp "${name}" not found. Use ./warps to see the list of warps.`);
    else if (warp.dimension.id !== sender.dimension.id) return sender.sendMessage(`§cPlease go to ${warp.dimension.id} to teleport to "${name}".`);

    sender.teleport({ x: warp.location.x, y: warp.location.y, z: warp.location.z });
    sender.sendMessage(`§7Teleported to warp "${name}".`);
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

function warpListCommand(sender) {
    if (!world.getDynamicProperty('warp'))
        return sender.sendMessage('§cThis command is disabled.');
    else if (!world.getDynamicProperty('warpInSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage('§cThis command cannot be used in survival mode.');
    
    let warpMap = getWarpMapCopy();

    if (warpMap.size === 0) return sender.sendMessage('§7There are no warps.');
    let output = '§2Available Warps:§r';
    warpMap.forEach((currWarp) => {
        output += `\n§7- ${currWarp.name}§r`;
    });

    sender.sendMessage(output);
}
