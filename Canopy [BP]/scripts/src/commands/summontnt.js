import { world } from '@minecraft/server'
import { Rule, Command } from 'lib/canopy/Canopy'
import Utils from 'stickycore/utils'

new Rule({
    category: 'Rules',
    identifier: 'commandSummonTnt',
    description: 'Enables summontnt command.'
});

new Command({
    name: 'summontnt',
    description: 'Summons the specified amount of primed TNT entity at your location.',
    usage: 'summontnt <amount>',
    args: [
        { type: 'number', name: 'amount' }
    ],
    callback: summonTntCommand,
    contingentRules: ['commandSummonTnt']
});

function summonTntCommand(sender, args) {
    if (!['creative', 'spectator'].includes(sender.getGameMode())) return sender.sendMessage('§cThis command can only be used in creative mode or spectator mode.');
    let { amount } = args;

    amount = Math.max(0, Math.min(amount, 5000));
    if (amount === 0) return sender.sendMessage('§7No TNT summoned.')
    Utils.broadcastActionBar(`§7${sender.name} summoned §c${amount} TNT§7.`, sender);
    for (let i = 0; i < amount; i++) {
        sender.dimension.spawnEntity('minecraft:tnt', sender.location);
    }
}