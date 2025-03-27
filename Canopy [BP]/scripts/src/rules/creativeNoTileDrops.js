import { Rule, Rules } from "../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import { calcDistance } from "../../include/utils";

const REMOVAL_DISTANCE = 2.5;

new Rule({
    category: 'Rules',
    identifier: 'creativeNoTileDrops',
    description: { translate: 'rules.creativeNoTileDrops' }
});

let brokenBlockEventsThisTick = [];
let brokenBlockEventsLastTick = [];

system.runInterval(() => {
    brokenBlockEventsLastTick = brokenBlockEventsThisTick;
    brokenBlockEventsThisTick = [];
});

world.afterEvents.playerBreakBlock.subscribe((blockEvent) => {
    if (blockEvent.player?.getGameMode() !== 'creative' 
        || !Rules.getNativeValue('creativeNoTileDrops')) 
        return;
    brokenBlockEventsThisTick.push(blockEvent);
});

world.afterEvents.entitySpawn.subscribe((entityEvent) => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!Rules.getNativeValue('creativeNoTileDrops')) return;

    const item = entityEvent.entity;
    const brokenBlockEvents = brokenBlockEventsThisTick.concat(brokenBlockEventsLastTick);
    const brokenBlockEvent = brokenBlockEvents.find(blockEvent => isItemWithinRemovalDistance(blockEvent.block.location, item));
    if (!brokenBlockEvent) return;

    item.remove();
});

function isItemWithinRemovalDistance(location, item) {
    return calcDistance(location, item.location) < REMOVAL_DISTANCE;
}