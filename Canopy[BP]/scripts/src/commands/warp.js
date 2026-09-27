import { BooleanRule, PlayerCommandOrigin, Rules, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, GameMode, system } from "@minecraft/server";
import Warps from '../classes/Warps';

new BooleanRule({
    category: 'Rules',
    identifier: 'commandWarp',
    description: { translate: 'rules.commandWarp' },
    wikiDescription: 'Determines whether the `/warp` and `/warps` commands can be used.'
});

new BooleanRule({
    category: 'Rules',
    identifier: 'commandWarpSurvival',
    description: { translate: 'rules.commandWarpSurvival' },
    contingentRules: ['commandWarp'],
    wikiDescription: 'Determines whether the `/warp` command can be used while in Survival mode.'
});

const WARP_USAGE = '/canopy:warp <add/remove/name> [warp-name]';

new VanillaCommand({
    name: 'canopy:warp',
    description: 'commands.warp',
    mandatoryParameters: [
        {
            name: 'add/remove/name',
            type: CustomCommandParamType.String
        }
    ],
    optionalParameters: [
        {
            name: 'warp-name',
            type: CustomCommandParamType.String
        }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    contingentRules: ['commandWarp'],
    aliases: ['canopy:w'],
    callback: (origin, action, name) => {
        const sender = origin.getSource();

        system.run(() => warpActionCommand(sender, {
            action: action ?? null,
            name: name ?? null
        }));

        return { status: CustomCommandStatus.Success };
    }
});

new VanillaCommand({
    name: 'canopy:warps',
    description: 'commands.warp.list',
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    contingentRules: ['commandWarp'],
    callback: (origin) => {
        const sender = origin.getSource();

        system.run(() => warpListCommand(sender));

        return { status: CustomCommandStatus.Success };
    }
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
        sendWarpUsage(sender);

}

function sendWarpUsage(sender) {
    sender.sendMessage({
        translate: 'commands.generic.usage',
        with: [WARP_USAGE]
    });
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
