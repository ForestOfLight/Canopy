import { world } from '@minecraft/server';
import { broadcastActionBar } from "../include/utils";

world.afterEvents.worldLoad.subscribe(() => {
const players = world.getAllPlayers();
    if (players[0]?.isValid)
        broadcastActionBar('§aBehavior packs have been reloaded.');
});