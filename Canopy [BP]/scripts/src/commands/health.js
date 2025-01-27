import { system } from '@minecraft/server'
import { Command } from 'lib/canopy/Canopy'
import { DataTPS } from 'src/tps'
import  { printDimensionEntities } from 'src/commands/entitydensity'
import Utils from 'include/utils'

new Command({
    name: 'health',
    description: { translate: 'commands.health' },
    usage: 'health',
    callback: healthCommand
})

function healthCommand(sender) {
    system.runTimeout(() => {
        printRealMspt(sender);
    }, 0);
    printDimensionEntities(sender);
    const tpsFormatted = DataTPS.tps > 20.0 ? `§a20.0` : `§c${DataTPS.tps.toFixed(1)}`;
    sender.sendMessage(`§7TPS:§r ${tpsFormatted}`);
}

function printRealMspt(sender) {
    const lastTick = system.currentTick;
    const { startTime, endTime } = Utils.wait(50);
    system.runTimeout(() => {
        if (system.currentTick - lastTick !== 1)
            return sender.sendMessage({ translate: 'commands.health.fail.mspt' });
        
        const realMspt = Date.now() - startTime - (endTime - startTime);
        const realMsptFormatted = realMspt > 50.0 ? `§c${realMspt}` : `§a${realMspt}`;
        sender.sendMessage(`§7MSPT:§r ${realMsptFormatted}`)
    }, 1);
}