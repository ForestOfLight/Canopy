import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

let brokenBlockEventsThisTick = [];
let brokenBlockEventsLastTick = [];

mc.system.runInterval(() => {
    brokenBlockEventsLastTick = brokenBlockEventsThisTick;
    brokenBlockEventsThisTick = [];
});

mc.world.afterEvents.playerBreakBlock.subscribe(blockEvent => {
    if (blockEvent.player.getGameMode() !== 'creative' 
        || !mc.world.getDynamicProperty('noContainerTileDrops')) 
        return;
    brokenBlockEventsThisTick.push(blockEvent);
});

mc.world.afterEvents.entitySpawn.subscribe(entityEvent => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!mc.world.getDynamicProperty('noContainerTileDrops')) return;

    const item = entityEvent.entity;
    const brokenBlockEvents = brokenBlockEventsThisTick.concat(brokenBlockEventsLastTick);
    const brokenBlockEvent = brokenBlockEvents.find(blockEvent => 
        Utils.calcDistance(blockEvent.block.location, item.location) < 2.5
    );
    if (!brokenBlockEvent) return;

    item.remove();
});