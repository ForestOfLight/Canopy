import * as mc from '@minecraft/server'
import Command from 'stickycore/command'

new Command()
    .setName('warps')
    .setCallback(warpListCommand)
    .build()

new Command()
    .setName('warp')
    .addArgument('string', 'action')
    .addArgument('string', 'name')
    .setCallback(warpActionCommand)
    .build()

new Command()
    .setName('w')
    .addArgument('string', 'action')
    .addArgument('string', 'name')
    .setCallback(warpActionCommand)
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

function getWarpMapCopy() {
    let warps = mc.world.getDynamicProperty('warps');
    if (warps === undefined) {
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

function addWarp(sender, name, warpMap) {
    if (warpMap.has(name)) return sender.sendMessage(`§cWarp "${name}" already exists. Use ./warps to see the list of warps.`);
    
    const { location, dimension } = sender;

    let warps = JSON.parse(mc.world.getDynamicProperty('warps'));
    warps.warpList[name] = new Warp(name, location, dimension);
    mc.world.setDynamicProperty(`warps`, JSON.stringify(warps));
    sender.sendMessage(`§aWarp "${name}" has been added.`);
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
    sender.sendMessage(`§aTeleported to warp "${name}".`);
}

function warpActionCommand(sender, args) {
    if (!mc.world.getDynamicProperty('warp'))
        return sender.sendMessage('§cThis command is disabled.');
    else if (!mc.world.getDynamicProperty('warpInSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage('§cThis command cannot be used in survival mode.');

    const { action, name } = args;
    const warpMap = getWarpMapCopy();

    switch (action) {
        case 'add':
            addWarp(sender, name, warpMap);
            break;
        case 'remove':
            removeWarp(sender, name, warpMap);
            break;
        case 'tp':
            warpTP(sender, name, warpMap);
            break;
        default:
            sender.sendMessage('§cInvalid command. Usage: ./warp <name> or ./warp <add/remove> <name>');
            break;
    }
}