import { world, system } from "@minecraft/server";
import ProbeManager from "./classes/ProbeManager";
import { Extensions } from "../lib/canopy/Canopy";
import { PACK_VERSION } from "../constants";

const hasShownWelcome = {};

world.afterEvents.playerJoin.subscribe((event) => {
    const runner = system.runInterval(() => {
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
    ProbeManager.startCleanupCycle();
}

function displayWelcome(player) {
    const graphic = [
        '§a   + ----- +\n',
        '§a /          / |\n',
        '§a+ ----- +  |\n',
        '§a |          |  +\n',
        '§a |          | /\n',
        '§a+ ----- +\n'
    ].join('');
    player.sendMessage({ rawtext: [{ text: graphic }, { translate: 'generic.welcome.start', with: [PACK_VERSION] }] });
    const extensions = Extensions.getVersionedNames();
    if (extensions.length > 0)
        player.sendMessage({ translate: 'generic.welcome.extensions', with: [extensions.join('§r§7, §a§o')] });
}
