import * as mc from '@minecraft/server'
import Command from 'stickycore/command'

new Command()
    .setName('summontnt')
    .addArgument('number', 'amount')
    .setCallback(summonTntCommand)
    .build()

function summonTntCommand(sender, args) {
    if (!mc.world.getDynamicProperty('summontnt')) return sender.sendMessage('§cThe summontnt feature is disabled.');
    if (sender.getGameMode() != 'creative') return sender.sendMessage('§cThis command can only be used in creative mode.');
    let { amount } = args;

    amount = Math.max(0, Math.min(amount, 5000));
    if (amount === 0) return sender.sendMessage('§7No TNT summoned.')
    sender.sendMessage(`§cSummoning ${amount} TNT...`);
    const players = mc.world.getPlayers();
    players.filter(player => player !== sender).forEach(player => {
        player.sendMessage(`§7[${sender.name} summoned ${amount} TNT]`);
    });
    for (let i = 0; i < amount; i++) sender.dimension.spawnEntity('minecraft:tnt', sender.location);
}