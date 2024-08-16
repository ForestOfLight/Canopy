import { system } from '@minecraft/server'
import { Command } from 'lib/canopy/Canopy'
import { DataTPS } from 'src/tps'
import  { Entities } from 'src/entities'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

new Command({
    name: 'health',
    description: 'Displays the server\'s current TPS, MSPT, and entity counts.',
    usage: 'health',
    callback: healthCommand
})

function healthCommand(sender) {
    system.runTimeout(() => {
        printRealMspt(sender);
    }, 0);
    Entities.printDimensionEntities(sender);
    const tpsFormatted = DataTPS.tps > 20.0 ? `§a20.0` : `§c${DataTPS.tps.toFixed(1)}`;
    sender.sendMessage(`§7TPS:§r ${tpsFormatted}`);
}

function printRealMspt(sender) {
    let lastTick;
    let startTime;
    let endTime;
    let realMspt;

    lastTick = Data.getAbsoluteTime();
    ({ startTime, endTime } = Utils.wait(50));
    system.runTimeout(() => {
        if (Data.getAbsoluteTime() - lastTick != 1) return sender.sendMessage(`§cCould not compute MSPT. Please report this error.`);
        
        realMspt = Date.now() - startTime - (endTime - startTime);
        const realMsptFormatted = realMspt > 50.0 ? `§c${realMspt}` : `§a${realMspt}`;
        sender.sendMessage(`§7MSPT:§r ${realMsptFormatted}`)
    }, 1);
}