import { world } from '@minecraft/server';
import Utils from 'include/utils';
import ProbeManager from 'src/classes/ProbeManager';
import { Command } from 'lib/canopy/Canopy';

const players = world.getAllPlayers();
if (players[0]?.isValid()) {
    Utils.broadcastActionBar('§aBehavior packs have been reloaded.');
    ProbeManager.startCleanupCycle();
    Command.broadcastPrefix();
}