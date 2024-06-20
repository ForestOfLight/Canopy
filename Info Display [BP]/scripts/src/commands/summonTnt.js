import * as mc from '@minecraft/server'
import Command from 'stickycore/command'

new Command()
    .setName('summonTnt')
    .addArgument('number', 'amount')
    .setCallback(summonTntCommand)
    .build()

function summonTntCommand(sender, args) {
    if (!mc.world.getDynamicProperty('summonTnt')) return sender.sendMessage('§cThis command is disabled. Use ./help for more options.');
    else if (sender.getGameMode() != 'creative') return sender.sendMessage('§cThis command can only be used in creative mode.');
    const { amount } = args;

    if (amount < 1) return sender.sendMessage('§cAmount must be greater than 0.');
    else if (amount > 10000) return sender.sendMessage('§cAmount must be less than 10,000.');
    sender.sendMessage(`§cSummoning ${amount} TNT...`);
    const ow = mc.world.getDimension('overworld');
    for (let i = 0; i < amount; i++) ow.spawnEntity('minecraft:tnt', sender.location);
}