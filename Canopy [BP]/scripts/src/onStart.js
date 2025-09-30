import { world, system } from "@minecraft/server";
import { displayWelcome } from "./rules/noWelcomeMessage";

let worldIsValid = false;

world.afterEvents.playerJoin.subscribe((event) => {
    const runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!player) return;
            if (player?.isValid) {
                system.clearRun(runner);
                onValidPlayer(player);
                if (!worldIsValid)
                    onValidWorld();
                worldIsValid = true;
            }
        });
    });
});

function onValidPlayer(player) {
    displayWelcome(player);
}

function onValidWorld() {
    
}
