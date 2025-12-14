import { AbilityRule } from "../../lib/canopy/Canopy";
import { ChunkBorderRender } from "../classes/ChunkBorderRender";
import { playerChangeSubChunkEvent } from "../events/PlayerChangeSubChunkEvent";

export class ChunkBorders extends AbilityRule {
    playerChunkBorderRenderers = {};

    constructor() {
        super({
            identifier: 'chunkBorders',
            onEnableCallback: () => {
                playerChangeSubChunkEvent.subscribe(this.onPlayerChangeSubChunkBound);
            },
            onDisableCallback: () => {
                playerChangeSubChunkEvent.unsubscribe(this.onPlayerChangeSubChunkBound);
                this.stopAllRenderingBorders();
            }
        }, { 
            slotNumber: 13,
            onPlayerEnableCallback: (player) => this.drawChunkBorders(player),
            onPlayerDisableCallback: (player) => this.stopRenderingBorders(player)
        });
        this.onPlayerChangeSubChunkBound = this.onPlayerChangeSubChunk.bind(this);
        this.chunkBorderRenderers = {};
    }

    stopAllRenderingBorders() {
        const renderingPlayers = Object.keys(this.chunkBorderRenderers);
        for (const playerId of renderingPlayers)
            this.stopRenderingBorders({ player: { id: playerId } });
    }

    stopRenderingBorders(player) {
        this.chunkBorderRenderers[player.id]?.destroy();
        delete this.chunkBorderRenderers[player.id];
    }

    onPlayerChangeSubChunk(event) {
        const player = event.player;
        if (!player || !this.isEnabledForPlayer(player))
            return;
        this.drawChunkBorders(player);
    }

    drawChunkBorders(player) {
        if (this.chunkBorderRenderers[player.id])
            this.chunkBorderRenderers[player.id].destroy();
        this.chunkBorderRenderers[player.id] = new ChunkBorderRender(player.location, player.dimension);
    }
}

export const chunkBorders = new ChunkBorders();