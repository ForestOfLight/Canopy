import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { system, world, GameMode, EntityInitializationCause } from "@minecraft/server";
import { calcDistance } from "../../include/utils";

export class CreativeNoTileDrops extends BooleanRule {
    REMOVAL_DISTANCE = 2.5;
    
    brokenBlockEventsThisTick = [];
    brokenBlockEventsLastTick = [];
    #runner = void 0;
    #onPlayerBreakBlockBound;
    #onEntitySpawnBound;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'creativeNoTileDrops',
            wikiDescription: 'Removes items dropping from blocks and entities when removing them in creative mode. Unlike the vanilla gamerule, this also suppresses drops from containers and only applies when *you* break them - not when they break in the world.',
            onEnableCallback: () => this.subscribeToEvents(),
            onDisableCallback: () => this.unsubscribeFromEvents()
        }));
        this.#onPlayerBreakBlockBound = this.onPlayerBreakBlock.bind(this);
        this.#onEntitySpawnBound = this.onEntitySpawn.bind(this);
    }

    subscribeToEvents() {
        this.#runner = system.runInterval(this.onTick.bind(this));
        world.afterEvents.playerBreakBlock.subscribe(this.#onPlayerBreakBlockBound);
        world.afterEvents.entitySpawn.subscribe(this.#onEntitySpawnBound);
    }

    unsubscribeFromEvents() {
        if (this.#runner !== void 0) {
            system.clearRun(this.#runner);
            this.#runner = void 0;
        }
        world.afterEvents.playerBreakBlock.unsubscribe(this.#onPlayerBreakBlockBound);
        world.afterEvents.entitySpawn.unsubscribe(this.#onEntitySpawnBound);
    }
        
    onTick() {
        this.brokenBlockEventsLastTick = this.brokenBlockEventsThisTick;
        this.brokenBlockEventsThisTick = [];
    }
    
    onPlayerBreakBlock(blockEvent) {
        if (blockEvent.player?.getGameMode() !== GameMode.Creative) 
            return;
        this.brokenBlockEventsThisTick.push(blockEvent);
    }
    
    onEntitySpawn(entityEvent) {
        if (entityEvent.entity.typeId !== 'minecraft:item', entityEvent.cause !== EntityInitializationCause.Spawned)
            return;
        const item = entityEvent.entity;
        const brokenBlockEvents = this.brokenBlockEventsThisTick.concat(this.brokenBlockEventsLastTick);
        const brokenBlockEvent = brokenBlockEvents.find(blockEvent => this.isItemWithinRemovalDistance(blockEvent.block.location, item));
        if (!brokenBlockEvent)
            return;

        item.remove();
    }
    
    isItemWithinRemovalDistance(location, item) {
        return calcDistance(location, item.location) < this.REMOVAL_DISTANCE;
    }
}

export const creativeNoTileDrops = new CreativeNoTileDrops();