import { world } from '@minecraft/server';
import { broadcastActionBar } from "../include/utils";
import { simplayerRejoining } from "./rules/simplayer/simplayerRejoining";
import { LegacyInventoryMigrator } from "./classes/simplayer/LegacyInventoryMigrator";

world.afterEvents.worldLoad.subscribe(async () => {
    // Must finish before anyone rejoins: rejoining loads an inventory, and a simplayer that
    // rejoined ahead of the migration would load nothing and then save that over their real items.
    await LegacyInventoryMigrator.migrate();
    const players = world.getAllPlayers();
    if (players[0]?.isValid) {
        broadcastActionBar('§aBehavior packs have been reloaded.');
        simplayerRejoining.onStartup();
    }
});