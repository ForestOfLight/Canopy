import EntityLog from "./EntityLog";
import { world, system } from "@minecraft/server";
import { stringifyLocation } from "../../include/utils";

class EntityTntLog extends EntityLog {
    constructor(type, { main, secondary, tertiary }) {
        super(type, { main, secondary, tertiary });
        this.tntSpawnLocations = {};
        this.removedTntThisTick = [];
        this.initEvents();
    }

    initEvents() {
        world.afterEvents.entitySpawn.subscribe((event) => this.onSpawn(event.entity));
        world.beforeEvents.entityRemove.subscribe((event) => this.onRemove(event.removedEntity));
        system.runInterval(() => this.onTick());
    }

    onSpawn(entity) {
        if (entity?.typeId === 'minecraft:tnt') 
            this.tntSpawnLocations[entity.id] = entity.location;
    }

    onRemove(entity) {
        if (entity?.typeId === 'minecraft:tnt' && this.subscribedPlayers.length > 0)
            this.removedTntThisTick.push({ id: entity.id, location: entity.location });
    }

    onTick() {
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
        const maxTick = 1000;
        const shiftedTick = String(system.currentTick % maxTick).padStart(2, '0');
        const coloredTick = `${shiftedTick.slice(0, -2)}${this.colors.secondary}${shiftedTick.slice(-2)}${this.colors.main}`;
        return { rawtext: [
            { text: `${this.colors.tertiary}----- ` },
            { translate: 'generic.total' },
            { text: `: ${this.removedTntThisTick.length} ${this.colors.main}(tick: ${coloredTick}${this.colors.main})${this.colors.tertiary} -----`}
        ]};
    }

    getLogBody(precision) {
        let output = '';
        for (let i = 0; i < this.removedTntThisTick.length; i++) {
            const tntEntity = this.removedTntThisTick[i];
            const startLocation = stringifyLocation(this.tntSpawnLocations[tntEntity.id], precision);
            const endLocation = stringifyLocation(tntEntity.location, precision);
            output += `§a${startLocation}§7 --> §c${endLocation}`;
            if (i < this.removedTntThisTick.length - 1)
                output += ', ';
            delete this.tntSpawnLocations[tntEntity.id];
        }
        if (output.length > 0)
            output += '§r\n';
        this.removedTntThisTick = [];
        return output;
    }
}

export default EntityTntLog;