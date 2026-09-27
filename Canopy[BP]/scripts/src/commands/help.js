import { Command, Extensions } from '../../lib/canopy/Canopy';

new Command({
    name: 'help',
    description: { translate: 'commands.help' },
    usage: 'help',
    callback: helpCommand,
    wikiDescription: 'Provides a starting point for Canopy help. Use `/help` to browse native commands, `/rules` for global and extension rules, `/info` for InfoDisplay rules, and `/version` for Canopy and extension versions. Legacy commands registered by extensions are listed here as well.'
});

function helpCommand(sender) {
    const message = {
        rawtext: [
            { text: '§l§aCanopy Help§r' },
            { text: '\n§7Commands: §f/help' },
            { text: '\n§7Global and extension rules: §f/rules' },
            { text: '\n§7InfoDisplay rules: §f/info' },
            { text: '\n§7Version and extensions: §f/version' }
        ]
    };

    const extensionCommands = Extensions.getAll()
        .flatMap(extension => extension.getCommands())
        .filter(command => !command.isHelpHidden());

    if (extensionCommands.length > 0) {
        message.rawtext.push({ text: '\n§7Extension commands:' });

        for (const command of extensionCommands) {
            message.rawtext.push({
                rawtext: [
                    { text: `\n  §2${command.getUsage()}§8 - ` },
                    command.getDescription()
                ]
            });
        }
    }

    sender.sendMessage(message);
}
