import { system, world} from '@minecraft/server'

// Config
import 'src/config/database'

// Commands
import 'src/commands/info'
import 'src/commands/help'
import 'src/commands/peek'
import 'src/commands/jump'
import 'src/commands/warp'
import 'src/commands/gamemode'
import 'src/commands/camera'
import 'src/commands/feature'
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

// Script Events
import 'src/commands/scriptevents/counter'
import 'src/commands/scriptevents/spawn'

// Features
import 'src/features/InfoDisplay'
import 'src/features/tnt/noExplosionBlockDamage'
import 'src/features/pickupOnMine'
import 'src/features/universalChunkLoading'
import 'src/features/noTileDrops'
import 'src/features/flippinArrows'
import 'src/features/tnt/noTntPrimeMomentum'
import 'src/features/tnt/hardcodedTntPrimeMomentum'
import 'src/features/tnt/dupeTnt'
import 'src/features/pistonBedrockBreaking'
import 'src/features/hotbarSwitching'

// Data & Utils
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'

// Reload message
const allPlayers = world.getAllPlayers();
if (allPlayers[0] !== undefined && allPlayers[0].isValid()) {
    Utils.broadcastActionBar('§aBehavior packs have been reloaded.');
}

// Welcome message
let hasShownWelcome = false;

world.afterEvents.playerJoin.subscribe((event) => {
    let runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!hasShownWelcome && player.isValid()) {
                system.clearRun(runner);
                hasShownWelcome = true;
                displayWelcome(player);
            }
        });
    });
});

function displayWelcome(player) {
    let output = '';
    output += `§a   + ----- +\n`;
    output += `§a /          / |\n`;
    output += `§a+ ----- +  |\n`;
    output += `§a |          |  +\n`;
    output += `§a |          | /\n`;
    output += `§a+ ----- +\n`;
    output += `§7This server is running §l§aCanopy§r§7. Type ./help to get started.§r\n`;
    player.sendMessage(output);
}