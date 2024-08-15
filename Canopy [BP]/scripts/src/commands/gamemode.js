import { Command } from 'lib/canopy/Canopy';

new Command({
    name: 's',
    description: 'Set your gamemode to survival.',
    usage: 's',
    callback: (sender) => setPlayerGamemode(sender, 'survival')
});

new Command({
    name: 'c',
    description: 'Set your gamemode to creative.',
    usage: 'c',
    callback: (sender) => setPlayerGamemode(sender, 'creative')
});

new Command({
    name: 'sp',
    description: 'Set your gamemode to spectator.',
    usage: 'sp',
    callback: (sender) => setPlayerGamemode(sender, 'spectator')
});

function setPlayerGamemode(sender, gamemode) {
    let commandText = `gamemode ${gamemode}`;
    sender.runCommand(commandText);
}
