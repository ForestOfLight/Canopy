import { Command } from '../../lib/canopy/Canopy';

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
        callback: (sender) => sender.runCommand(`gamemode ${gamemodeMap[key]}`),
        opOnly: true
    });
}
