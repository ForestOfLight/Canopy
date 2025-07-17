import { CommandPermissionLevel, system } from '@minecraft/server';
import { VanillaCommand } from '../../lib/canopy/Canopy';

const gamemodeMap = {
    's': 'survival',
    'a': 'adventure',
    'c': 'creative',
    'sp': 'spectator'
};

for (const key in gamemodeMap) {
    new VanillaCommand({
        name: 'canopy:' + key,
        description: `commands.gamemode.${key}`,
        permissionLevel: CommandPermissionLevel.GameDirectors,
        callback: (source) => { system.run(() => source.runCommand(`gamemode ${gamemodeMap[key]}`)); }
    });
}
