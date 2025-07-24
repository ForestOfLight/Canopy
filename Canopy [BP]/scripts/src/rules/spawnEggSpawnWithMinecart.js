import { EntityComponentTypes } from "@minecraft/server";
import { GlobalRule } from "../../lib/canopy/GlobalRule";
import { spawnEggSpawnEntityEvent } from "../events/SpawnEggSpawnEntityEvent";

export class SpawnEggSpawnWithMinecart extends GlobalRule {
    railBlockTypes = [ 'minecraft:rail', 'minecraft:golden_rail', 'minecraft:detector_rail', 'minecraft:activator_rail' ];

    constructor() {
        super({
            identifier: 'spawnEggSpawnWithMinecart',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        });
        this.onSpawnEggSpawnBound = this.onSpawnEggSpawn.bind(this);
    }

    subscribeToEvent() {
        spawnEggSpawnEntityEvent.subscribe(this.onSpawnEggSpawnBound);
    }

    unsubscribeFromEvent() {
        spawnEggSpawnEntityEvent.unsubscribe(this.onSpawnEggSpawnBound);
    }

    onSpawnEggSpawn(event) {
        if (!this.railBlockTypes.includes(event.block.typeId))
            return;
        this.putInMinecart(event.entity);
    }

    putInMinecart(entity) {
        const minecart = entity.dimension.spawnEntity('minecraft:minecart', entity.location);
        const rideableComponent = minecart.getComponent(EntityComponentTypes.Rideable);
        rideableComponent.addRider(entity);
    }
}

export const spawnEggSpawnWithMinecart = new SpawnEggSpawnWithMinecart();