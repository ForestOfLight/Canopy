import { DataTPS } from 'src/tps'
import Command from 'stickycore/command'

new Command()
    .setName('tps')
    .setCallback(tpsCommand)
    .build()

function tpsCommand(sender) {
    const tpsFormatted = DataTPS.tps > 20.0 ? `§a20.0` : `§c${DataTPS.tps.toFixed(1)}`;
    sender.sendMessage(`§7TPS:§r ${tpsFormatted}`);
}