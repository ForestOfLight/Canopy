import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandGamemode',
    description: { translate: 'rules.commandGamemode.description' },
});

const gamemodeMap = {
    's': 'survival',
    'a': 'adventure',
    'c': 'creative',
    'sp': 'spectator'
};

for (const key in gamemodeMap) {
    new Command({
        name: key,
        description: { translate: `commands.gamemode.${key}.description` },
        usage: key,
        callback: (sender) => sender.runCommand(`gamemode ${gamemodeMap[key]}`),
        contingentRules: ['commandGamemode']
    });
}
