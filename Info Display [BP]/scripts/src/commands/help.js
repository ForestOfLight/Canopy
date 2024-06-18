import Dynamic, { module } from 'stickycore/dynamic'
import Command from 'stickycore/command'

new Command()
    .setName('help')
    .setCallback(helpCommand)
    .build()

function helpCommand(sender) {
    const INFO = module.exports['infoDisplay'];
    const PEEK = module.exports['peek'];
    const JUMP = module.exports['jump'];
    const PLOT = module.exports['plot'];
    const GAMEMODE = module.exports['gamemode'];
    const CAMERA = module.exports['camera'];

    const MODULES = { INFO, PEEK, JUMP, PLOT, GAMEMODE, CAMERA };
    const CMDS = {
        INFO: './info <feature> <true/false> - Toggles a feature on or off. (alias: ./i)',
        PEEK: './peek - Peeks at a block or entity\'s inventory. (alias: ./p)',
        JUMP: './jump - Teleports you to the block you\'re looking at. (alias: ./j)',
        PLOT: './plot tp <name> - Teleports you to a plot. (alias: ./pl)' +
            '\n./plot <add/remove> <name> - Adds or removes a plot. (alias: ./pl)' +
            '\n./plotlist - Lists all available plots.',
        GAMEMODE: './s, ./c, ./sp - Easy gamemode switching.',
        CAMERA: './placeCamera - Places a camera at your current location. (alias: ./pc)' +
            '\n./viewCamera - Toggles viewing your latest camera placement. (alias: ./vc)'
    }
    const DynamicFeatures = [ 'INFO' ];

    let outputHelp = '§2InfoDisplay Pack Features:§r';

    for (let mod in MODULES) {
        const [ content, syntax ] = [ Object.values(MODULES[mod]), CMDS[mod] ];

        outputHelp += `\n§2${syntax}§r`;

        for (let feature of content) {
            let value = '';
            if (DynamicFeatures.includes(mod)) {
                value = sender.getDynamicProperty(feature)
                if (value === undefined) value = false;
                value = value ? '§aenabled' : '§cdisabled';
                outputHelp += `\n  §7- ${feature}: ${value}§r`;
            }
        }
    }

    sender.sendMessage(outputHelp);
}