import { system, world } from '@minecraft/server'
import Command from 'stickycore/command'

const MAX_FUSE_TICKS = 72000;

world.afterEvents.entitySpawn.subscribe(event => {
    if (event.entity.typeId !== 'minecraft:tnt') return;
    const fuseTimeProperty = world.getDynamicProperty('tntFuseTime');
    let fuseTime = 80;
    if (fuseTimeProperty !== undefined && world.getDynamicProperty('commandTntFuse'))
        fuseTime = fuseTimeProperty;
    
    if (fuseTime === 80) {
        event.entity.triggerEvent('canopy:normalFuse');
    } else {
        event.entity.triggerEvent('canopy:longFuse');
        system.runTimeout(() => {
            event.entity.triggerEvent('canopy:explode');
        }, fuseTime);
    }
});

new Command()
    .setName('tntfuse')
    .addArgument('number|string', 'ticks')
    .setCallback(tntfuseCommand)
    .build()

function tntfuseCommand(sender, args) {
    if (!world.getDynamicProperty('commandTntFuse')) return sender.sendMessage('§cThe commandTntFuse feature is disabled.');
    let { ticks } = args;
    if (ticks === null) {
        return sender.sendMessage('§cUsage: ./tntfuse <ticks/reset>');
    } else if (ticks === 'reset') {
        ticks = 80;
        sender.sendMessage('§7Reset TNT fuse time to §a80§7 ticks.');
    } else if (ticks < 0 || ticks > MAX_FUSE_TICKS)
        return sender.sendMessage(`§cInvalid fuse time: ${ticks} ticks. Must be between 0 and ${MAX_FUSE_TICKS} seconds.`);
    else {
        sender.sendMessage(`§7TNT fuse time set to §a${ticks}§7 ticks.`);
    }
    world.setDynamicProperty('tntFuseTime', ticks);
}
