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
    const CAMERA = module.exports['camera'];
    const COUNTERS = module.exports['hopperCounters'];
    const DISTANCE = module.exports['distance'];
    const ENTITYDENSITY = module.exports['entitydensity'];
    const HEALTH = module.exports['health'];
    const GAMEMODE = module.exports['gamemode'];
    const JUMP = module.exports['jump'];
    const PEEK = module.exports['peek'];
    const SUMMONTNT = module.exports['summontnt'];
    const TNTLOG = module.exports['tntlog'];
    const WARP = module.exports['warp'];
    const RESETALL = module.exports['resetall'];

    const MODULES = { INFO, FEATURES, CAMERA, COUNTERS, DISTANCE, ENTITYDENSITY, HEALTH, GAMEMODE, JUMP, PEEK, SUMMONTNT, TNTLOG, WARP, 
        RESETALL, };
    const CMDS = {
        INFO:           './info <feature> <true/false> - Toggles some info on or off. (alias: ./i)',
        FEATURES:       './feature <feature> <true/false> - Toggles a global feature on or off.',
        CAMERA:         './placecamera - Places a camera at your current location. (alias: ./pc)' +
                      '\n./viewcamera - Toggles viewing your latest camera placement. (alias: ./vc)',
        COUNTERS:       './counter <color> <add/remove/reset/query> - Manages hopper counters. (alias: ./ct)' +
                      '\n./counter <color> <track/untrack> - Tracks or untracks a hopper counter in the InfoDisplay. (alias: ./ct)' +
                      '\n./counter <color> <mode> - Sets the mode of a hopper counter: countmode, hourmode, minutemode, or secondmode. (alias: ./ct)' +
                      '\n./counters - Lists all active hopper counters, their count, and hourly rate. (alias: ./cts)',
        DISTANCE:       './distance - Calculates the distance between you and the block you are looking at. (alias: ./d)',
        ENTITYDENSITY:  './entitydensity <dimension> <grid size> - Identifies dense areas of entities in the specified dimension.',
        HEALTH:         './health - Displays the server\'s current TPS and MSPT in chat.',
        GAMEMODE:       './s, ./c, ./sp - Easy gamemode switching.',
        JUMP:           './jump - Teleports you to the block you\'re looking at. (alias: ./j)',
        PEEK:           './peek - Peeks at a block or entity\'s inventory. (alias: ./p)',
        SUMMONTNT:      './summontnt <amount> - Summons the specified amount of primed TNT entity at your location.',
        TNTLOG:         './tntlog <on/off> - Toggles primed TNT location logging.' +
                      '\n./tntlog <precision> - Sets the precision of primed TNT location logging. (default: 2)',
        WARP:           './warp tp <name> - Teleports you to a warp. (alias: ./w)' +
                      '\n./warp <add/remove> <name> - Adds or removes a warp. (alias: ./w)' +
                      '\n./warps - Lists all available warps.',
        RESETALL:       './resetall - Resets all InfoDisplay features and data.',
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