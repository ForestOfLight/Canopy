// Commands
import 'src/commands/info'
import 'src/commands/help'
import 'src/commands/peek'
import 'src/commands/jump'
import 'src/commands/warp'
import 'src/commands/gamemode'
import 'src/commands/camera'
import 'src/commands/canopy'
import 'src/commands/distance'
import 'src/commands/log'
import 'src/commands/summontnt'
import 'src/commands/entitydensity'
import 'src/commands/health'
import 'src/commands/counter'
import 'src/commands/resetall'
import 'src/commands/data'
import 'src/commands/tick'
import 'src/commands/changedimension'
import 'src/commands/spawn'
import 'src/commands/claimprojectiles'
import 'src/commands/trackevent'
import 'src/commands/tntfuse'
import 'src/commands/removeentity'

// Script Events
import 'src/commands/scriptevents/counter'
import 'src/commands/scriptevents/spawn'

// Rules
import 'src/features/InfoDisplay'
import 'src/features/explosionNoBlockDamage'
import 'src/features/autoItemPickup'
import 'src/features/universalChunkLoading'
import 'src/features/noTileDrops'
import 'src/features/flippinArrows'
import 'src/features/tntPrimeNoMomentum'
import 'src/features/tntPrimeMaxMomentum'
import 'src/features/dupeTnt'
import 'src/features/pistonBedrockBreaking'
import 'src/features/hotbarSwitching'
import 'src/features/renewableSponge'
import 'src/features/armorStandRespawning'
import 'src/features/explosionOff'
import 'src/features/explosionChainReactionOnly'
import 'src/features/instantTame'
import 'src/features/entityInstantDeath'
import 'src/features/renewableElytra'

// Misc Processes
import 'src/validWorld'

// Reload message
import { world } from '@minecraft/server';
import Utils from 'stickycore/utils';
import ProbeManager from 'src/classes/ProbeManager';
import { Command } from 'lib/canopy/Canopy';

const players = world.getAllPlayers();
if (players[0] !== undefined && players[0].isValid()) {
    Utils.broadcastActionBar('§aBehavior packs have been reloaded.');
    ProbeManager.startCleanupCycle();
    Command.broadcastPrefix();
}
