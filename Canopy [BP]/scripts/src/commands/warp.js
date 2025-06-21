import { Rule, Command, Rules } from "../../lib/canopy/Canopy";
import { GameMode } from "@minecraft/server";
import Warps from '../classes/Warps';

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
});

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

function warpActionCommand(sender, args) {
    if (!Rules.getNativeValue('commandWarpSurvival') && [GameMode.Survival, GameMode.Adventure].includes(sender.getGameMode()))
        return sender.sendMessage({ translate: 'commands.generic.blocked.survival' });

    let { action, name } = args;
    if (Number.isInteger(action)) action = action.toString();
    if (Number.isInteger(name)) name = name.toString();

    if (action === 'add') 
        addWarp(sender, name);
    else if (action === 'remove') 
        removeWarp(sender, name);
    else if (Warps.has(action)) 
        warpTP(sender, action);
    else if (action !== null && !Warps.has(action)) 
        sender.sendMessage({ translate: 'commands.warp.noexist', with: [action] });
    else 
        cmd.sendUsage(sender);
    
}

function addWarp(sender, name) {
    try {
        Warps.add(name, sender.location, sender.dimension.id);
    } catch (e) {
        if (e.message === 'Warp already exists')
            return sender.sendMessage({ translate: 'commands.warp.exists', with: [name] });
        throw e;
    }
    sender.sendMessage({ translate: 'commands.warp.add.success', with: [name] });
}

function removeWarp(sender, name) {
    try {
        Warps.remove(name);
    } catch (e) {
        if (e.message === `Failed to remove warp ${name}`)
            return sender.sendMessage({ translate: 'commands.warp.noexist', with: [name] });
        throw e;
    }
    sender.sendMessage({ translate: 'commands.warp.remove.success', with: [name] });
}

function warpTP(sender, name) {
    try {
        Warps.teleport(sender, name);
    } catch (e) {
        if (e.message === 'Warp does not exist')
            return sender.sendMessage({ translate: 'commands.warp.noexist', with: [name] });
        throw e;
    }
    sender.sendMessage({ translate: 'commands.warp.tp.success', with: [name] });
}

function warpListCommand(sender) {
    if (!Rules.getNativeValue('commandWarpSurvival') && sender.getGameMode() === GameMode.Survival)
        return sender.sendMessage({ translate: 'commands.generic.blocked.survival' });
    sender.sendMessage(getWarpListMessage());
}

function getWarpListMessage() {
    if (Warps.isEmpty())
        return { translate: 'commands.warp.list.empty' };
    const message = { rawtext: [{ translate: 'commands.warp.list.header' }] };
    const warpNames = Warps.getNames();
    for (const warpName of warpNames)
        message.rawtext.push({ text: `\n§7- ${warpName}` });
    return message;
}
