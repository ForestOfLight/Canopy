import { system, world } from "@minecraft/server";
import { worldSpawns } from "../../commands/spawn";
import { getScriptEventSourceName, broadcastActionBar } from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:spawn') return;
    const sourceName = getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === 'test') resetSpawnCounters(sourceName);
    if (message === 'tracking') printTrackingStatus();
});

function resetSpawnCounters(sourceName) {
    if (worldSpawns === null)
        return broadcastActionBar({ translate: 'commands.spawn.tracking.no' });
    worldSpawns.reset();
    broadcastActionBar({ translate: 'commands.spawn.tracking.reset.success.actionbar', with: [sourceName] });
}

function printTrackingStatus() {
    if (worldSpawns === null)
        return broadcastActionBar({ translate: 'commands.spawn.tracking.no' });
    world.sendMessage(worldSpawns.getOutput());
}