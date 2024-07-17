import { system, world } from '@minecraft/server'
import Utils from 'stickycore/utils'

let brokenBlockEventsThisTick = [];
let brokenBlockEventsLastTick = [];

system.runInterval(() => {
    brokenBlockEventsLastTick = brokenBlockEventsThisTick;
    brokenBlockEventsThisTick = [];
});

world.afterEvents.playerBreakBlock.subscribe(blockEvent => {
    if (blockEvent.player.getGameMode() !== 'creative' 
        || !world.getDynamicProperty('noTileDrops')) 
        return;
    brokenBlockEventsThisTick.push(blockEvent);
});

world.afterEvents.entitySpawn.subscribe(entityEvent => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!world.getDynamicProperty('noTileDrops')) return;

    const item = entityEvent.entity;
    const brokenBlockEvents = brokenBlockEventsThisTick.concat(brokenBlockEventsLastTick);
    const brokenBlockEvent = brokenBlockEvents.find(blockEvent => 
        Utils.calcDistance(blockEvent.block.location, item.location) < 2.5
    );
    if (!brokenBlockEvent) return;

    item.remove();
});