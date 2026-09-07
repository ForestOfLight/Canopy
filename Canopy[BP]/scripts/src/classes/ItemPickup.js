import { system, world } from "@minecraft/server";
import { calcDistance } from "../../include/utils";
import { InventoryUtils } from "./InventoryUtils";

class ItemPickup {
    static PICKUP_RANGE = 4;
    brokenBlockEventsThisTick = [];
    shouldPickup;
    #runner = void 0;

    constructor(pickupConditionCallback) {
        this.shouldPickup = pickupConditionCallback;
        this.onPlayerBreakBlockBound = this.onPlayerBreakBlock.bind(this);
        this.onEntitySpawnBound = this.onEntitySpawn.bind(this);
    }

    subscribeToEvents() {
        this.#runner = system.runInterval(() => this.onTick());
        world.afterEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlockBound);
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawnBound);
    }

    unsubscribeFromEvents() {
        if (this.#runner !== void 0)
            system.clearRun(this.#runner);
        world.afterEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlockBound);
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawnBound);
    }

    onTick() {
        this.brokenBlockEventsThisTick = [];
    }

    onPlayerBreakBlock(event) {
        if (!this.shouldPickup(event.player))
            return;
        this.brokenBlockEventsThisTick.push(event);
    }

    onEntitySpawn(event) {
        if (event.cause !== 'Spawned' || event.entity?.typeId !== 'minecraft:item')
            return;
        const itemEntity = event.entity;
        const brokenBlockEvent = this.findBrokenBlockEventWhichDropped(itemEntity);
        if (!brokenBlockEvent)
            return;
        InventoryUtils.pickupItemEntity(brokenBlockEvent.player, itemEntity);
    }

    findBrokenBlockEventWhichDropped(itemEntity) {
        let brokenBlockEvent;
        try {
            const itemEntityLocation = itemEntity.location;
            brokenBlockEvent = this.brokenBlockEventsThisTick.find(blockEvent => this.entityCameFromBlock(blockEvent, itemEntityLocation));
        } catch {
            /* pass */
        }
        return brokenBlockEvent;
    }

    entityCameFromBlock(blockEvent, itemEntityLocation) {
        return calcDistance(blockEvent.block.location, itemEntityLocation) < ItemPickup.PICKUP_RANGE;
    }
}

export default ItemPickup;
