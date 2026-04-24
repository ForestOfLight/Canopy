import { VanillaCommand, PlayerCommandOrigin } from '../../lib/canopy/Canopy';
import { CommandPermissionLevel, system } from '@minecraft/server';

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
        allowedSources: [PlayerCommandOrigin],
        callback: (origin) => { system.run(() => origin.getSource().runCommand(`gamemode ${gamemodeMap[key]}`)); }
    });
}
