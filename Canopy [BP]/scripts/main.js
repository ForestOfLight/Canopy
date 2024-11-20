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
import 'src/commands/pos'
import 'src/commands/cleanup'
import 'src/commands/sit'

// Script Events
import 'src/commands/scriptevents/counter'
import 'src/commands/scriptevents/spawn'
import 'src/commands/scriptevents/tick'

// Rules
import 'src/rules/InfoDisplay'
import 'src/rules/explosionNoBlockDamage'
import 'src/rules/autoItemPickup'
import 'src/rules/universalChunkLoading'
import 'src/rules/noTileDrops'
import 'src/rules/flippinArrows'
import 'src/rules/tntPrimeNoMomentum'
import 'src/rules/tntPrimeMaxMomentum'
import 'src/rules/dupeTnt'
import 'src/rules/pistonBedrockBreaking'
import 'src/rules/hotbarSwitching'
import 'src/rules/renewableSponge'
import 'src/rules/armorStandRespawning'
import 'src/rules/explosionOff'
import 'src/rules/explosionChainReactionOnly'
import 'src/rules/instantTame'
import 'src/rules/entityInstantDeath'
import 'src/rules/renewableElytra'
import 'src/rules/beeNoDrown'
import 'src/rules/instaminableDeepslate'
import 'src/rules/instaminableEndstone'
import 'src/rules/quickFillContainer'
import 'src/rules/durabilityNotifier'
import 'src/rules/allowBubbleColumnPlacement'
import 'src/rules/cauldronConcreteConversion'
import 'src/rules/creativeOneHitKill'
import 'src/rules/playerSit'

// Misc Processes
import 'src/validWorld'

// Reload message
import { world } from '@minecraft/server';
import Utils from 'stickycore/utils';
import ProbeManager from 'src/classes/ProbeManager';
import { Command } from 'lib/canopy/Canopy';

const players = world.getAllPlayers();
if (players[0]?.isValid()) {
    Utils.broadcastActionBar('§aBehavior packs have been reloaded.');
    ProbeManager.startCleanupCycle();
    Command.broadcastPrefix();
}
