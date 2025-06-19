import { Command } from '../../lib/canopy/Canopy';
import { CommandPermissionLevel } from '@minecraft/server';

const gamemodeMap = {
    's': 'survival',
    'a': 'adventure',
    'c': 'creative',
    'sp': 'spectator'
};

for (const key in gamemodeMap) {
    new Command({
        name: key,
        description: { translate: `commands.gamemode.${key}` },
        usage: key,
        callback: (sender) => { gamemodeCommand(sender, gamemodeMap[key]) }
    });
}

function gamemodeCommand(sender, gamemode) {
    if (sender.commandPermissionLevel === CommandPermissionLevel.Any)
        return sender.sendMessage({ translate: 'commands.generic.nopermission' });
    sender.runCommand(`gamemode ${gamemode}`);
}
