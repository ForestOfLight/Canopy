import { world, system, DimensionTypes } from "@minecraft/server";
import { displayWelcome } from "./rules/noWelcomeMessage";
import { simplayerRejoining } from "./rules/simplayer/simplayerRejoining";
import { understudyInventoryEditor } from "./classes/simplayer/UnderstudyInventoryEditor";
import { ProxyInventoryEntity } from "./classes/simplayer/editor/ProxyInventoryEntity";

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
    simplayerRejoining.onStartup();
    understudyInventoryEditor.start();
    sweepInventoryProxies();
}

function sweepInventoryProxies() {
    DimensionTypes.getAll().map(dimensionType => dimensionType.typeId).forEach(dimensionId => {
        ProxyInventoryEntity.sweepOrphans(world.getDimension(dimensionId));
    });
}
