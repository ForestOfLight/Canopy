import { system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { CollisionBoxRenderer } from "../classes/CollisionBoxRenderer";

export class CollisionBoxes extends AbilityRule {
    RENDER_DISTANCE = 32;
    collisionBoxRenderers = {};
    runners = {};

    constructor() {
        super({
            identifier: 'collisionBoxes',
            onEnableCallback: () => {},
            onDisableCallback: () => {
                this.stopAllRendering();
            }
        }, { 
            slotNumber: 14,
            onPlayerEnableCallback: (player) => this.startRendering(player.id),
            onPlayerDisableCallback: (player) => this.stopRendering(player.id)
        });
    }

    startRendering(playerId) {
        if (this.runners[playerId])
            this.stopRendering(playerId);
        this.collisionBoxRenderers[playerId] = {};
        this.runners[playerId] = system.runInterval(this.onTick.bind(this));
    }

    stopRendering(playerId) {
        if (this.runners[playerId]) {
            system.clearRun(this.runners[playerId]);
            delete this.runners[playerId];
        }
        if (this.collisionBoxRenderers[playerId]) {
            for (const renderer of Object.values(this.collisionBoxRenderers[playerId]))
                renderer.destroy();
            delete this.collisionBoxRenderers[playerId];
        }
    }

    refresh() {
        for (const playerId of Object.keys(this.runners)) {
            this.stopRendering(playerId);
            this.startRendering(playerId);
        }
    }

    stopAllRendering() {
        for (const playerId of Object.keys(this.runners))
            this.stopRendering(playerId);
    }

    onTick() {
        for (const playerId of Object.keys(this.runners)) {
            const player = world.getEntity(playerId);
            if (!player) {
                this.stopRendering(playerId);
                continue;
            }
            this.renderForNearbyEntities(player);
        }
    }

    renderForNearbyEntities(player) {
        const entities = this.getNearbyEntities(player).filter(entity => entity?.id !== player.id);
        const rendererMap = this.collisionBoxRenderers[player.id] || {};
        
        for (const [entityId, renderer] of Object.entries(rendererMap)) {
            if (!entities.some(e => e.id === entityId)) {
                renderer.destroy();
                delete rendererMap[entityId];
            }
        }        
        for (const entity of entities) {
            if (!rendererMap[entity.id])
                rendererMap[entity.id] = new CollisionBoxRenderer(entity, player);
        }
        this.collisionBoxRenderers[player.id] = rendererMap;
    }

    getNearbyEntities(player) {
        return player.dimension.getEntities({ location: player.location, maxDistance: this.RENDER_DISTANCE }); 
    }
}

export const collisionBoxes = new CollisionBoxes();