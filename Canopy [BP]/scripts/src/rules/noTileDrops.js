import { system, world } from '@minecraft/server';
import { Rule, Rules } from "../../lib/canopy/Canopy";
import Utils from "../../include/utils";

const REMOVAL_DISTANCE = 2.5;

new Rule({
    category: 'Rules',
    identifier: 'noTileDrops',
    description: { translate: 'rules.noTileDrops' },
});

let brokenBlockEventsThisTick = [];
let brokenBlockEventsLastTick = [];

system.runInterval(() => {
    brokenBlockEventsLastTick = brokenBlockEventsThisTick;
    brokenBlockEventsThisTick = [];
});

world.afterEvents.playerBreakBlock.subscribe(async (blockEvent) => {
    if (blockEvent.player?.getGameMode() !== 'creative' 
        || !Rules.getNativeValue('noTileDrops')) 
        return;
    brokenBlockEventsThisTick.push(blockEvent);
});

world.afterEvents.entitySpawn.subscribe(async (entityEvent) => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!Rules.getNativeValue('noTileDrops')) return;

    const item = entityEvent.entity;
    const brokenBlockEvents = brokenBlockEventsThisTick.concat(brokenBlockEventsLastTick);
    const brokenBlockEvent = brokenBlockEvents.find(blockEvent => isItemWithinRemovalDistance(blockEvent.block.location, item));
    if (!brokenBlockEvent) return;

    item.remove();
});

function isItemWithinRemovalDistance(location, item) {
    return Utils.calcDistance(location, item.location) < REMOVAL_DISTANCE;
}