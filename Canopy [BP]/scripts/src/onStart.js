import { world } from '@minecraft/server';
import Utils from "../include/utils";
import ProbeManager from "./classes/ProbeManager";

const players = world.getAllPlayers();
if (players[0]?.isValid()) {
    Utils.broadcastActionBar('§aBehavior packs have been reloaded.');
    ProbeManager.startCleanupCycle();
}