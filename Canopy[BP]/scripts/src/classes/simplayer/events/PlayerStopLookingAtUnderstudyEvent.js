import { world } from "@minecraft/server";
import { Event } from "../../../events/Event";
import Understudies from "../Understudies";

export class PlayerStopLookingAtUnderstudyEvent extends Event {
    playersLookingAtUnderstudiesThisTick = {};
    playersLookingAtUnderstudiesLastTick = {};

    provideEvents() {
        this.updatePlayerLookingAtStatus();
        return this.getFormattedEvents();
    }

    updatePlayerLookingAtStatus() {
        this.playersLookingAtUnderstudiesLastTick = { ...this.playersLookingAtUnderstudiesThisTick };
        this.playersLookingAtUnderstudiesThisTick = {};
        world.getAllPlayers().forEach(player => {
            if (!player || Understudies.isUnderstudy(player))
                return;
            this.playersLookingAtUnderstudiesThisTick[player.id] = this.getLookingAtUnderstudy(player);
        });
    }

    getFormattedEvents() {
        const events = [];
        for (const playerId in this.playersLookingAtUnderstudiesThisTick) {
            const lookingAtUnderstudy = this.playersLookingAtUnderstudiesThisTick[playerId];
            const lastLookingAtUnderstudy = this.playersLookingAtUnderstudiesLastTick[playerId];
            if (lastLookingAtUnderstudy || !lookingAtUnderstudy) {
                events.push({
                    player: world.getEntity(playerId),
                    understudy: Understudies.get(lookingAtUnderstudy.name)
                });
            }
        }
        return events;
    }

    getLookingAtUnderstudy(player) {
        const raycastOptions = {
            type: "minecraft:player",
            maxDistance: 7,
            ignoreBlockCollision: false,
            includeLiquidBlocks: false,
            includePassableBlocks: false
        };
        const entityRaycastHits = player.getEntitiesFromViewDirection(raycastOptions);
        const entity = entityRaycastHits[0]?.entity;
        if (Understudies.isUnderstudy(entity))
            return entity;
        return void 0;
    }
}

export const playerStopLookingAtUnderstudy = new PlayerStopLookingAtUnderstudyEvent();
