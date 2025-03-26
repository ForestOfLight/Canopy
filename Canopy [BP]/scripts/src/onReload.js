import { world } from '@minecraft/server';
import { broadcastActionBar } from "../include/utils";
import ProbeManager from "./classes/ProbeManager";

world.afterEvents.worldLoad.subscribe(() => {
const players = world.getAllPlayers();
    if (players[0]?.isValid) {
        broadcastActionBar('§aBehavior packs have been reloaded.');
        ProbeManager.startCleanupCycle();
    }
});