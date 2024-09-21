import { world, system } from '@minecraft/server';
import Data from 'stickycore/data';
import ProbeManager from 'src/classes/ProbeManager';
import { getLoadedExtensions } from 'lib/canopy/Canopy';

let hasShownWelcome = {};

world.afterEvents.playerJoin.subscribe((event) => {
    let runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!player) return;
            if (!hasShownWelcome[player.id] && player?.isValid()) {
                system.clearRun(runner);
                hasShownWelcome[player.id] = true;
                onValidWorld(player);
            }
        });
    });
});

world.afterEvents.playerLeave.subscribe((event) => {
    hasShownWelcome[event.playerId] = false;
});

function onValidWorld(player) {
    displayWelcome(player);
    Data.updateJoinDate(player);
    ProbeManager.startCleanupCycle();
}

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
    const extensions = getLoadedExtensions();
    if (extensions.length > 0) {
        player.sendMessage(`§7Loaded extensions: §a${extensions.join('§7, §a')}`);
    }
}
