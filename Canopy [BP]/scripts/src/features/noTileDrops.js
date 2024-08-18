import { Rule } from 'lib/canopy/Rule';
import { system, world } from '@minecraft/server';
import Utils from 'stickycore/utils';

new Rule({
    category: 'Rules',
    identifier: 'noTileDrops',
    description: 'Prevents items dropping from blocks broken in creative mode.',
});

let brokenBlockEventsThisTick = [];
let brokenBlockEventsLastTick = [];

system.runInterval(() => {
    brokenBlockEventsLastTick = brokenBlockEventsThisTick;
    brokenBlockEventsThisTick = [];
});

world.afterEvents.playerBreakBlock.subscribe(blockEvent => {
    if (blockEvent.player.getGameMode() !== 'creative' 
        || !Rule.getValue('noTileDrops')) 
        return;
    brokenBlockEventsThisTick.push(blockEvent);
});

world.afterEvents.entitySpawn.subscribe(entityEvent => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!Rule.getValue('noTileDrops')) return;

    const item = entityEvent.entity;
    const brokenBlockEvents = brokenBlockEventsThisTick.concat(brokenBlockEventsLastTick);
    const brokenBlockEvent = brokenBlockEvents.find(blockEvent => 
        Utils.calcDistance(blockEvent.block.location, item.location) < 2.5
    );
    if (!brokenBlockEvent) return;

    item.remove();
});