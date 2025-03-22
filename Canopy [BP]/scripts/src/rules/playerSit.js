import { DimensionTypes, EntityComponentTypes, system, world } from "@minecraft/server";
import { GlobalRule } from "../../lib/canopy/Canopy";
import { playerStartSneakEvent } from "../events/PlayerStartSneakEvent";

const ruleID = 'playerSit';
const SNEAK_COUNT = 3;

class PlayerSit extends GlobalRule {
    sneakCount = SNEAK_COUNT;
    sneakSpeedMs = 4*50;
    playerSneaks = {};

    constructor() {
        super({
            identifier: ruleID,
            description: { translate: `rules.${ruleID}`, with: [SNEAK_COUNT.toString()] },
            onEnableCallback: () => playerStartSneakEvent.subscribe(this.onPlayerStartSneak.bind(this)),
            onDisableCallback: () => playerStartSneakEvent.unsubscribe(this.onPlayerStartSneak.bind(this))
        });
        this.startEntityCleanup();
    }

    onPlayerStartSneak(event) {
        event.players.forEach(player => {
            this.handlePlayerSneak(player);
        });
    }

    handlePlayerSneak(player) {
        const currentTimeMs = Date.now();
        const sneakTracker = this.playerSneaks[player.id] || { count: 0, lastTimeMs: currentTimeMs, lastTick: system.currentTick };
        if (player.isOnGround && currentTimeMs - sneakTracker.lastTimeMs < this.sneakSpeedMs) {
            sneakTracker.count++;
            if (sneakTracker.count >= this.sneakCount) {
                this.sit(player);
                sneakTracker.count = 0;
            }
        } else {
            sneakTracker.count = 1;
        }
        sneakTracker.lastTimeMs = currentTimeMs;
        sneakTracker.lastTick = system.currentTick;
        this.playerSneaks[player.id] = sneakTracker;
    }
    
    sit(player) {
        const heightAdjustment = -0.12;
        const entityLocation = { x: player.location.x, y: player.location.y + heightAdjustment, z: player.location.z };
        const rideableEntity = player.dimension.spawnEntity('canopy:rideable', entityLocation);
        rideableEntity.setRotation(player.getRotation());
        rideableEntity.getComponent('rideable').addRider(player);
    }

    startEntityCleanup() {
        system.runInterval(this.cleanupEntities.bind(this), 10);
    }

    cleanupEntities() {
        DimensionTypes.getAll().forEach((dimensionType) => {
            this.removeEntitiesWithNoRider(world.getDimension(dimensionType.typeId).getEntities({ type: 'canopy:rideable' }));
        });
    }

    removeEntitiesWithNoRider(entities) {
        entities.forEach(entity => {
            if (entity.getComponent(EntityComponentTypes.Rideable).getRiders().length === 0)
                entity.remove();
        });
    }
}

export const playerSit = new PlayerSit();