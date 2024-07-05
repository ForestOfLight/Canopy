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
    const DATA = module.exports['data'];
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

    const MODULES = { INFO, FEATURES, CAMERA, DATA, COUNTERS, DISTANCE, ENTITYDENSITY, HEALTH, GAMEMODE, JUMP, PEEK, SUMMONTNT, TNTLOG, WARP, 
        RESETALL, };
    const CMDS = {
        INFO:           './info <feature> <true/false> - Toggles some info on or off. (alias: ./i)',
        FEATURES:       './feature <feature> <true/false> - Toggles a global feature on or off.',
        CAMERA:         './camera place - Places a camera at your current location. (alias: ./cp)' +
                      '\n./camera view - Toggles viewing your latest camera placement. (alias: ./cv)',
        DATA:           './data - Displays information about the block you are looking at.',
        COUNTERS:       './counter [color/all] - Displays the count and rates of the hopper counters. (alias: ./ct)' +
                      '\n./counter <color/all> <mode> - Sets the mode of a hopper counter: countMode, perhourMode, perminuteMode, or persecondMode. (alias: ./ct)' +
                      '\n./counter realtime - Toggles real-world time and tick-based time to do rate calculations. (alias: ./ct)',
        DISTANCE:       './distance target - Calculates the distance between you and the block or entity you are looking at. (alias: ./d)' +
                      '\n./distance from <x y z> to [x y z] - Calculates the distance between two points. (alias: ./d)' +
                      '\n./distance from [x y z] - Saves a location to calculate distance to later. (alias: ./d)' +
                      '\n./distance to [x y z] - Calculates the distance from the saved location to the specified location. (alias: ./d)',
        ENTITYDENSITY:  './entitydensity [dimension] <grid size> - Identifies dense areas of entities in the specified dimension.',
        HEALTH:         './health - Displays the server\'s current TPS, MSPT, and entity counts.',
        GAMEMODE:       './s, ./c, ./sp - Easy gamemode switching.',
        JUMP:           './jump - Teleports you to the block you\'re looking at. (alias: ./j)',
        PEEK:           './peek - Peeks at a block or entity\'s inventory. (alias: ./p)',
        SUMMONTNT:      './summontnt <amount> - Summons the specified amount of primed TNT entity at your location.',
        TNTLOG:         './tntlog <true/false> - Toggles primed TNT location logging.' +
                      '\n./tntlog <precision> - Sets the precision of primed TNT location logging. (default: 2)',
        WARP:           './warp tp <name> - Teleports you to a warp. (alias: ./w)' +
                      '\n./warp <add/remove> <name> - Adds or removes a warp. (alias: ./w)' +
                      '\n./warps - Lists all available warps.',
        RESETALL:       './resetall - Resets all Canopy features and data.',
    };
    const DynamicFeatures = [ 'INFO', 'FEATURES' ];

    let outputHelp = '§l§aCanopy§r§2 Features:§r';

    for (let mod in MODULES) {
        let [ content, syntax ] = [ Object.values(MODULES[mod]), CMDS[mod] ];

        syntax = syntax.replace(/\n/g, '\n§2');
        syntax = syntax.replace(/ -/g, ' §7-');
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