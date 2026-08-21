import { world } from "@minecraft/server";
import { Event } from "../../../events/Event";
import Understudies from "../Understudies";

export class PlayerStartLookingAtUnderstudyEvent extends Event {
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
            const lookingAtUnderstudy = this.getLookingAtUnderstudy(player);
            if (lookingAtUnderstudy)
                this.playersLookingAtUnderstudiesThisTick[player.id] = lookingAtUnderstudy;
            else
                delete this.playersLookingAtUnderstudiesThisTick[player.id];
        });
    }

    getFormattedEvents() {
        const events = [];
        for (const playerId in this.playersLookingAtUnderstudiesThisTick) {
            const lookingAtUnderstudy = this.playersLookingAtUnderstudiesThisTick[playerId];
            const lastLookingAtUnderstudy = this.playersLookingAtUnderstudiesLastTick[playerId];
            if (!lastLookingAtUnderstudy || !this.isLookingAtSameUnderstudy(lookingAtUnderstudy, lastLookingAtUnderstudy)) {
                events.push({
                    player: world.getEntity(playerId),
                    understudy: Understudies.get(lookingAtUnderstudy.name)
                });
            }
        }
        return events;
    }

    isLookingAtSameUnderstudy(lookingAtUnderstudy, lastLookingAtUnderstudy) {
        return lookingAtUnderstudy?.name === lastLookingAtUnderstudy?.name;
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

export const playerStartLookingAtUnderstudy = new PlayerStartLookingAtUnderstudyEvent();
