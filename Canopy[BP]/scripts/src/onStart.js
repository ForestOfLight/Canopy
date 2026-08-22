import { world, system } from "@minecraft/server";
import { displayWelcome } from "./rules/noWelcomeMessage";
import { startWorldSystems } from "./worldStartup";

world.afterEvents.playerJoin.subscribe((event) => {
    const runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!player) return;
            if (player?.isValid) {
                system.clearRun(runner);
                displayWelcome(player);
                startWorldSystems();
            }
        });
    });
});
