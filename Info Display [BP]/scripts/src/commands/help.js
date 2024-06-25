import { module } from 'stickycore/dynamic'
import Command from 'stickycore/command'
import * as mc from '@minecraft/server'

new Command()
    .setName('help')
    .setCallback(helpCommand)
    .build()

function helpCommand(sender) {
    const INFO = module.exports['infoDisplay'];
    const FEATURES = module.exports['features'];
    const PEEK = module.exports['peek'];
    const JUMP = module.exports['jump'];
    const WARP = module.exports['warp'];
    const GAMEMODE = module.exports['gamemode'];
    const CAMERA = module.exports['camera'];
    const DISTANCE = module.exports['distance'];
    const TNTLOG = module.exports['tntlog'];
    const ENTITYDENSITY = module.exports['entitydensity'];
    const TPS = module.exports['tps'];

    const MODULES = { INFO, FEATURES, PEEK, JUMP, WARP, GAMEMODE, CAMERA, DISTANCE, TNTLOG, ENTITYDENSITY, TPS };
    const CMDS = {
        INFO:           './info <feature> <true/false> - Toggles some info on or off. (alias: ./i)',
        FEATURES:       './feature <feature> <true/false> - Toggles a global feature on or off.',
        PEEK:           './peek - Peeks at a block or entity\'s inventory. (alias: ./p)',
        JUMP:           './jump - Teleports you to the block you are looking at. (alias: ./j)',
        WARP:           './warp tp <name> - Teleports you to a warp. (alias: ./w)' +
                      '\n./warp <add/remove> <name> - Adds or removes a warp. (alias: ./w)' +
                      '\n./warps - Lists all available warps.',
        GAMEMODE:       './s, ./c, ./sp - Easy gamemode switching.',
        CAMERA:         './placecamera - Places a camera at your current location. (alias: ./pc)' +
                      '\n./viewcamera - Toggles viewing your latest camera placement. (alias: ./vc)',
        DISTANCE:       './distance - Calculates the distance between you and the block you are looking at. (alias: ./d)',
        TNTLOG:         './tntlog <on/off> - Toggles primed TNT location logging.' +
                      '\n./tntlog <precision> - Sets the precision of primed TNT location logging. (default: 2)',
        ENTITYDENSITY:  './entitydensity <dimension> <grid size> - Identifies dense areas of entities in the specified dimension.',
        TPS:            './tps - Displays the server\'s current ticks per second (TPS) in chat.',
    };
    const DynamicFeatures = [ 'INFO', 'FEATURES' ];

    let outputHelp = '§2InfoDisplay Pack Features:§r';

    for (let mod in MODULES) {
        const [ content, syntax ] = [ Object.values(MODULES[mod]), CMDS[mod] ];

        outputHelp += `\n§2${syntax}§r`;

        for (let feature of content) {
            let value = '';
            if (DynamicFeatures.includes(mod)) {
                if (mod === 'INFO') value = sender.getDynamicProperty(feature);
                else if (mod === 'FEATURES') value = mc.world.getDynamicProperty(feature);
                if (value === undefined) value = false;
                value = value ? '§atrue' : '§cfalse';
                outputHelp += `\n  §7- ${feature}: ${value}§r`;
            }
        }
    }

    sender.sendMessage(outputHelp);
}