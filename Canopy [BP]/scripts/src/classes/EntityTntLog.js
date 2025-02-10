import EntityLog from "./EntityLog";
import { world, system } from "@minecraft/server";
import { stringifyLocation } from "../../include/utils";

class EntityTntLog extends EntityLog {
    constructor(type, { main, secondary, tertiary }) {
        super(type, { main, secondary, tertiary });
        this.tntSpawnLocations = {};
        this.removedTntThisTick = [];
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe((event) => this.onSpawn(event.entity));
        world.beforeEvents.entityRemove.subscribe((event) => this.onRemove(event.removedEntity));
    }

    onSpawn(entity) {
        if (entity?.typeId === 'minecraft:tnt') 
            this.tntSpawnLocations[entity.id] = entity.location;
    }

    onRemove(entity) {
        if (entity?.typeId === 'minecraft:tnt') {
            this.subscribedPlayers.forEach(loggingPlayer => {
                if (loggingPlayer.types.includes('tnt'))
                    this.removedTntThisTick.push(entity);
            });
        }
    }

    update() {
        for (const player of this.subscribedPlayers) {
            if (this.isPrintable()) {
                const precision = player.getDynamicProperty('logPrecision');
                player.sendMessage(this.getLogHeader());
                player.sendMessage(this.getLogBody(precision));
            }
        }
        this.removedTntThisTick = [];
    }

    isPrintable() {
        return this.removedTntThisTick.length > 0;
    }

    getLogHeader() {
        return { rawtext: [
            { text: `${this.colors.tertiary}----- ` },
            { translate: 'generic.total' },
            { text: `: ${this.removedTntThisTick.length} ${this.colors.main}(tick: ${system.currentTick}${this.colors.main})${this.colors.tertiary} -----`}
        ]};
    }

    getLogBody(precision) {
        let output = '';
        for (const tntEntity of this.removedTntThisTick) {
            const startLocation = stringifyLocation(this.tntSpawnLocations[tntEntity.id], precision);
            const endLocation = stringifyLocation(tntEntity.location, precision);
            output += `§a${startLocation}§7 --> §c${endLocation}, `;
            delete this.tntSpawnLocations[tntEntity.id];
        }
        if (output.length > 0)
            output += '§r\n';
        this.removedTntThisTick = [];
        return output;
    }
}

export default EntityTntLog;