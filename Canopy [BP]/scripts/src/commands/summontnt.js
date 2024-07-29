import { world } from '@minecraft/server'
import Command from 'stickycore/command'
import Utils from 'stickycore/utils'

new Command()
    .setName('summontnt')
    .addArgument('number', 'amount')
    .setCallback(summonTntCommand)
    .build()

function summonTntCommand(sender, args) {
    if (!world.getDynamicProperty('summontnt')) return sender.sendMessage('§cThe summontnt feature is disabled.');
    if (sender.getGameMode() !== 'creative') return sender.sendMessage('§cThis command can only be used in creative mode.');
    let { amount } = args;

    amount = Math.max(0, Math.min(amount, 5000));
    if (amount === 0) return sender.sendMessage('§7No TNT summoned.')
    Utils.broadcastActionBar(sender, `§7${sender.name} summoned §c${amount} TNT§7.`)
    for (let i = 0; i < amount; i++) sender.dimension.spawnEntity('minecraft:tnt', sender.location);
}