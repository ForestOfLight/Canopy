import { system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { ChunkBorderRender } from "../classes/ChunkBorderRender";
import { playerChangeSubChunkEvent } from "../events/PlayerChangeSubChunkEvent";

export class ChunkBorders extends AbilityRule {
    playerChunkBorderRenderers = {};
    playersSkipNextEnable = {};

    constructor() {
        super({
            identifier: 'chunkBorders',
            onEnableCallback: () => {
                playerChangeSubChunkEvent.subscribe(this.onPlayerChangeSubChunkBound);
                world.afterEvents.playerJoin.subscribe(this.onPlayerJoin.bind(this));
            },
            onDisableCallback: () => {
                playerChangeSubChunkEvent.unsubscribe(this.onPlayerChangeSubChunkBound);
                world.afterEvents.playerJoin.unsubscribe(this.onPlayerJoin.bind(this));
                this.stopAllRenderingBorders();
            }
        }, { 
            slotNumber: 13, 
            onPlayerEnableCallback: (player) => this.drawChunkBorders(player),
            onPlayerDisableCallback: (player) => this.stopRenderingBorders(player)
        });
        this.onPlayerChangeSubChunkBound = this.onPlayerChangeSubChunk.bind(this);
        this.chunkBorderRenderers = {};
        this.playersSkipNextEnable = {};
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
        if (this.playersSkipNextEnable[player.id]) {
            if (this.playersSkipNextEnable[player.id] === system.currentTick)
                return;
            delete this.playersSkipNextEnable[player.id];
            return;
        }
        this.chunkBorderRenderers[player.id] = new ChunkBorderRender(player.location);
    }

    onPlayerJoin(event) {
        super.onPlayerJoin(event);
        this.playersSkipNextEnable[event.playerId] = system.currentTick;
    }
}

export const chunkBorders = new ChunkBorders();