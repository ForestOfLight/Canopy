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
    let graphic = '';
    graphic += `§a   + ----- +\n`;
    graphic += `§a /          / |\n`;
    graphic += `§a+ ----- +  |\n`;
    graphic += `§a |          |  +\n`;
    graphic += `§a |          | /\n`;
    graphic += `§a+ ----- +\n`;
    player.sendMessage({ rawtext: [{ text: graphic }, { translate: 'generic.welcome.start' }] });
    const extensions = getLoadedExtensions();
    if (extensions.length > 0) {
        player.sendMessage({ translate: 'generic.welcome.extensions', with: [extensions.join('§7, §a')] });
    }
}
