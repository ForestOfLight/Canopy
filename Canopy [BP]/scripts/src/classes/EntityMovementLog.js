import EntityLog from "./EntityLog";
import { world, system } from "@minecraft/server";

class EntityMovementLog extends EntityLog {
    constructor(type, { main, secondary, tertiary }) {
        super(type, { main, secondary, tertiary });
        this.startTick = system.currentTick;
        this.movingEntities = [];
        this.thisTickEntities = [];
        this.lastTickEntities = [];
        this.initEvents();
    }

    initEvents() {
        system.runInterval(() => this.onTick());
    }

    onTick() {
        if (this.subscribedPlayers.length === 0) return;
        this.updateEntityLists();
        for (const player of this.subscribedPlayers) {
            if (this.isPrintable()) {
                const precision = player.getDynamicProperty('logPrecision');
                player.sendMessage(this.getLogHeader());
                player.sendMessage(this.getLogBody(precision));
            }
        }
        this.updateLastTickEntities();
        if (!this.isPrintable())
            this.startTick = system.currentTick;
    }

    isPrintable() {
        return this.movingEntities.length > 0;
    }

    updateEntityLists() {
        this.thisTickEntities = [];
        this.movingEntities = [];
        for (const dimensionId of ['overworld', 'nether', 'the_end']) {
            const dimEntities = world.getDimension(dimensionId).getEntities();
            for (const entity of dimEntities) {
                if (this.hasTrait(entity, this.type)) 
                    this.thisTickEntities.push(entity);
            }
        }
        for (const entity of this.thisTickEntities) {
            if (this.hasMovedSinceLastTick(entity))
                this.movingEntities.push(entity);
        }
    }

    hasTrait(entity) {
        switch (this.type) {
            case 'projectiles':
                return entity.getComponent('minecraft:projectile') !== undefined;
            case 'falling_blocks':
                return entity.typeId === 'minecraft:falling_block';
            default:
                throw new Error(`Unknown entity log type: ${this.type}`);
        }
    }
    
    updateLastTickEntities() {
        this.lastTickEntities = [];
        for (const entity of this.thisTickEntities) {
            if (!entity.isValid()) return;
            this.lastTickEntities.push({
                id: entity.id,
                location: entity.location,
                dimension: entity.dimension
            });
        }
    }

    hasMovedSinceLastTick(entity) {
        const lastTickEntity = this.lastTickEntities.find(e => e.id === entity.id);
        if (lastTickEntity) {
            return !(lastTickEntity.location.x === entity.location.x &&
                 lastTickEntity.location.y === entity.location.y &&
                 lastTickEntity.location.z === entity.location.z &&
                 lastTickEntity.dimension.id === entity.dimension.id);
        }
        return false;
    }

    getLogHeader() {
        const shiftedTick = (system.currentTick - this.startTick).toString().padStart(2, '0');
        const coloredTick = `${shiftedTick.slice(0, -2)}${this.colors.secondary}${shiftedTick.slice(-2)}${this.colors.main}`;
        return { rawtext: [
            { text: `${this.colors.tertiary}----- ` },
            { translate: 'generic.total' },
            { text: `: ${this.movingEntities.length} ${this.colors.main}(tick: ${coloredTick}${this.colors.main})${this.colors.tertiary} -----`}
        ]};
    }

    getLogBody(precision) {
        const formattedTypeMap = this.createFormattedTypeMap(precision);
        let output = '';
        for (const typeId of Object.keys(formattedTypeMap)) 
            output += `${this.colors.tertiary}${typeId}\n${this.colors.main} > ${formattedTypeMap[typeId].join(', ')}\n`;
        return output;
    }

    createFormattedTypeMap(precision) {
        const typeMap = {};
        this.movingEntities.forEach(movingEntity => {
            if (typeMap[movingEntity.typeId] === undefined) typeMap[movingEntity.typeId] = [];
            typeMap[movingEntity.typeId].push(this.getFormattedLocation(movingEntity, precision));
        });
        return typeMap;
    }

    getFormattedLocation(entity, precision) {
        const x = entity.location.x.toFixed(precision);
        const y = entity.location.y.toFixed(precision);
        const z = entity.location.z.toFixed(precision);
        const lastTickEntity = this.lastTickEntities.find(e => e.id === entity.id);
        if (lastTickEntity === undefined)
            return `${this.colors.main}[${x}, ${y}, ${z}]`;
        const xColor = lastTickEntity.location.x === entity.location.x ? this.colors.main : this.colors.secondary;
        const yColor = lastTickEntity.location.y === entity.location.y ? this.colors.main : this.colors.secondary;
        const zColor = lastTickEntity.location.z === entity.location.z ? this.colors.main : this.colors.secondary;
        return `${this.colors.main}[${xColor}${x}${this.colors.main}, ${yColor}${y}${this.colors.main}, ${zColor}${z}${this.colors.main}]`;
    }
}

export default EntityMovementLog;