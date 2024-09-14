import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandGamemode',
    description: 'Enables shortened gamemode commands (e.g. `./s` for survival), including without OP.',
})

new Command({
    name: 's',
    description: 'Set your gamemode to survival.',
    usage: 's',
    callback: (sender) => setPlayerGamemode(sender, 'survival'),
    contingentRules: ['commandGamemode']
});

new Command({
    name: 'c',
    description: 'Set your gamemode to creative.',
    usage: 'c',
    callback: (sender) => setPlayerGamemode(sender, 'creative'),
    contingentRules: ['commandGamemode']
});

new Command({
    name: 'sp',
    description: 'Set your gamemode to spectator.',
    usage: 'sp',
    callback: (sender) => setPlayerGamemode(sender, 'spectator'),
    contingentRules: ['commandGamemode']
});

function setPlayerGamemode(sender, gamemode) {
    let commandText = `gamemode ${gamemode}`;
    sender.runCommand(commandText);
}
