import * as mc from '@minecraft/server'

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

// Features
import 'src/features/InfoDisplay'
import 'src/features/tnt/noExplosionBlockDamage'
import 'src/features/pickupOnMine'
import 'src/features/universalChunkLoading'
import 'src/features/noTileDrops'
import 'src/features/flippinArrows'
import 'src/features/tnt/noTntPrimeMomentum'
import 'src/features/tnt/hardcodedTntPrimeMomentum'

let hasShownWelcome = false;

mc.world.afterEvents.playerJoin.subscribe((event) => {
    let runner = mc.system.runInterval(() => {
        const players = mc.world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!hasShownWelcome && player.isValid()) {
                mc.system.clearRun(runner);
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