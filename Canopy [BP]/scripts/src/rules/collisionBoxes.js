import { system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { CollisionBoxRenderer } from "../classes/CollisionBoxRenderer";

export class CollisionBoxes extends AbilityRule {
    RENDER_DISTANCE = 32;
    collisionBoxRenderers = [];
    runners = {};

    constructor() {
        super({
            identifier: 'collisionBoxes',
            onEnableCallback: () => {},
            onDisableCallback: () => {
                this.stopAllRenderingCollisionBoxes();
            }
        }, { 
            slotNumber: 14,
            onPlayerEnableCallback: (player) => this.startRenderingCollisionBoxes(player),
            onPlayerDisableCallback: (player) => this.stopRenderingCollisionBoxes(player.id)
        });
    }

    stopAllRenderingCollisionBoxes() {
        for (const playerId of Object.keys(this.runners))
            this.stopRenderingCollisionBoxes(playerId);
    }

    stopRenderingCollisionBoxes(playerId) {
        if (this.runners[playerId]) {
            system.clearRun(this.runners[playerId]);
            delete this.runners[playerId];
        }
        this.collisionBoxRenderers.forEach(collisionBoxRenderer => collisionBoxRenderer.destroy());
    }

    startRenderingCollisionBoxes(player) {
        if (this.runners[player.id])
            this.stopRenderingCollisionBoxes(player.id);
        this.runners[player.id] = system.runInterval(this.onTick.bind(this));
    }

    onTick() {
        for (const playerId of Object.keys(this.runners)) {
            const player = world.getEntity(playerId);
            if (!player) {
                this.stopRenderingCollisionBoxes(playerId);
                continue;
            }
            this.renderCollisionForNearbyEntities(player);
        }
    }

    renderCollisionForNearbyEntities(player) {
        const entities = this.getNearbyEntities(player).filter(entity => entity?.typeId !== player.typeId);
        const rendererMap = {};
        for (const collisionBoxRenderer of this.collisionBoxRenderers) {
            const id = collisionBoxRenderer.entity?.id;
            if (id)
                rendererMap[id] = collisionBoxRenderer;
        }
        for (const [id, renderer] of Object.entries(rendererMap)) {
            if (!entities.map(e => e.id).includes(id)) {
                renderer.destroy();
                delete rendererMap[id];
            }
        }
        for (const entity of entities) {
            if (!Object.keys(rendererMap).includes(entity.id))
                rendererMap[entity.id] = new CollisionBoxRenderer(entity);
        }
        this.collisionBoxRenderers = Object.values(rendererMap);
    }

    getNearbyEntities(player) {
        return player.dimension.getEntities({ location: player.location, maxDistance: this.RENDER_DISTANCE }); 
    }
}

export const hitboxes = new CollisionBoxes();