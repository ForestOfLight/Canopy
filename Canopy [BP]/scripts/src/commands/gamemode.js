import Command from 'stickycore/command'

new Command()
    .setName('s')
    .setCallback((sender) => setPlayerGamemode(sender, 'survival'))
    .build()

new Command()
    .setName('c')
    .setCallback((sender) => setPlayerGamemode(sender, 'creative'))
    .build()

new Command()
    .setName('sp')
    .setCallback((sender) => setPlayerGamemode(sender, 'spectator'))
    .build()

function setPlayerGamemode(sender, gamemode) {
    let commandText = `gamemode ${gamemode}`;
    sender.runCommand(commandText);
}
