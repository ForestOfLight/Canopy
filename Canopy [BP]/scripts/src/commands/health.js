import Command from 'stickycore/command'
import { DataTPS } from 'src/tps'
import  { Entities } from 'src/entities'

new Command()
    .setName('health')
    .setCallback(healthCommand)
    .build()

function healthCommand(sender) {
    const tpsFormatted = DataTPS.tps > 20.0 ? `§a20.0` : `§c${DataTPS.tps.toFixed(1)}`;
    const msptFormatted = DataTPS.avgMspt > 51.0 ? `§c${DataTPS.avgMspt.toFixed(1)}` : `§a${DataTPS.avgMspt.toFixed(1)}`;
    sender.sendMessage(`§7TPS:§r ${tpsFormatted} §7MSPT:§r ${msptFormatted}`);
    Entities.printDimensionEntities(sender);
}