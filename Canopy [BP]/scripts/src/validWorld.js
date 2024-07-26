import { world, system } from '@minecraft/server';
import { LightLevel } from 'src/light'

let hasShownWelcome = false;

world.afterEvents.playerJoin.subscribe((event) => {
    let runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!hasShownWelcome && player.isValid()) {
                system.clearRun(runner);
                hasShownWelcome = true;
                onValidWorld(player);
            }
        });
    });
});

function onValidWorld(player) {
    displayWelcome(player);
    LightLevel.cleanUp();
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
}