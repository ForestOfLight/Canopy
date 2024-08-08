import { world } from '@minecraft/server'
import Command from 'stickycore/command'

// this is a command but it really should be a feature that lets you set the number

world.afterEvents.dataDrivenEntityTrigger.subscribe(event => {
    if (!world.getDynamicProperty('commandTntFuse')) return;
    if (event.eventId !== 'canopy:on_prime' || event.entity.typeId !== 'minecraft:tnt') return;
    const definitionModifier = event.getModifiers();
    console.warn('[TntFuse]', JSON.stringify(definitionModifier));
});

world.afterEvents.entitySpawn.subscribe(event => {
    if (event.entity.typeId !== 'minecraft:tnt') return;
    event.entity.triggerEvent('canopy:on_prime');
});

new Command()
    .setName('tntfuse')
    .addArgument('number', 'seconds')
    .setCallback(tntfuseCommand)
    .build()

function tntfuseCommand(sender, args) {
    if (!world.getDynamicProperty('commandTntFuse')) return sender.sendMessage('§cThe commandTntFuse feature is disabled.');
    const { seconds } = args;
    if (seconds < 0 || seconds > 3600)
        return sender.sendMessage(`§cInvalid fuse time: ${seconds} seconds. Must be between 0 and 3600 seconds.`);
    world.setDynamicProperty('tntFuseTime', seconds);
    sender.sendMessage(`§7TNT fuse time set to §a${seconds}§7 seconds.`);
}