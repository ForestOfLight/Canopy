import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { system, world, GameMode } from "@minecraft/server";
import { calcDistance } from "../../include/utils";
import { InventoryUtils } from "../classes/InventoryUtils";
import { AutoItemPickup } from "./autoItemPickup";

export class CarefulBreak extends BooleanRule {
    static PICKUP_RANGE = AutoItemPickup.PICKUP_RANGE;
    brokenBlockEventsThisTick = [];
    #runner = void 0;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'carefulBreak',
            onEnableCallback: () => this.subscribeToEvents(),
            onDisableCallback: () => this.unsubscribeFromEvents(),
            independentRules: ['autoItemPickup']
        }));
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

    shouldPickup(player) {
        return player?.isSneaking && player?.getGameMode() === GameMode.Survival;
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
            brokenBlockEvent = this.brokenBlockEventsThisTick.find(blockEvent => this.entityCameFromBlock(blockEvent, itemEntity));
        } catch {
            /* pass */
        }
        return brokenBlockEvent;
    }
    
    entityCameFromBlock(blockEvent, itemEntity) {
        return calcDistance(blockEvent.block.location, itemEntity.location) < CarefulBreak.PICKUP_RANGE;
    }
}

export const carefulBreak = new CarefulBreak();
