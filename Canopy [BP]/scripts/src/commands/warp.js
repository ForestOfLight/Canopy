import * as mc from '@minecraft/server'
import Command from 'stickycore/command'

new Command()
    .setName('warp')
    .addArgument('string|number', 'action')
    .addArgument('string|number', 'name')
    .setCallback(warpActionCommand)
    .build()

new Command()
    .setName('w')
    .addArgument('string|number', 'action')
    .addArgument('string|number', 'name')
    .setCallback(warpActionCommand)
    .build()

new Command()
    .setName('warps')
    .setCallback(warpListCommand)
    .build()

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

function warpActionCommand(sender, args) {
    if (!mc.world.getDynamicProperty('warp'))
        return sender.sendMessage('§cThe warp feature is disabled.');
    else if (!mc.world.getDynamicProperty('warpInSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage('§cThe warp feature is disabled in survival mode.');

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
    } else {
        sender.sendMessage('§cUsage: ./warp <name> or ./warp <add/remove> <name>');
    }
}

function addWarp(sender, name, warpMap) {
    if (warpMap.has(name)) return sender.sendMessage(`§cWarp "${name}" already exists. Use ./warps to see the list of warps.`);
    
    const { location, dimension } = sender;

    let warps = JSON.parse(mc.world.getDynamicProperty('warps'));
    warps.warpList[name] = new Warp(name, location, dimension);
    mc.world.setDynamicProperty(`warps`, JSON.stringify(warps));
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
    let warps = mc.world.getDynamicProperty('warps');
    if (warps === undefined || warps === false) {
        let initWarps = new Warps();
        mc.world.setDynamicProperty(`warps`, JSON.stringify(initWarps));
        warps = mc.world.getDynamicProperty('warps');
    }
    return new Map(Object.entries(JSON.parse(warps).warpList));
}

function setWarpMap(newWarpMap) {
    let warps = JSON.parse(mc.world.getDynamicProperty('warps'));
    let newWarpList = {};

    for (let [key, value] of Object.entries(warps.warpList)) {
        if (!newWarpMap.has(key)) continue;
        newWarpList[key] = newWarpMap.get(key);
    }
    warps.warpList = newWarpList;
    mc.world.setDynamicProperty(`warps`, JSON.stringify(warps));
}

function warpListCommand(sender) {
    if (!mc.world.getDynamicProperty('warp'))
        return sender.sendMessage('§cThis command is disabled.');
    else if (!mc.world.getDynamicProperty('warpInSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage('§cThis command cannot be used in survival mode.');
    
    let warpMap = getWarpMapCopy();

    if (warpMap.size === 0) return sender.sendMessage('§7There are no warps.');
    let output = '§2Available Warps:§r';
    warpMap.forEach((currWarp) => {
        output += `\n§7- ${currWarp.name}§r`;
    });

    sender.sendMessage(output);
}
