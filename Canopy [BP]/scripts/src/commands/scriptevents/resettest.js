import { system } from "@minecraft/server";
import { getScriptEventSourceName, broadcastActionBar } from "../../../include/utils";
import { counterChannels } from "../../classes/CounterChannels";
import { generatorChannels } from "../../classes/GeneratorChannels";
import { worldSpawns } from "../../commands/spawn";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:resettest') return;
    const sourceName = getScriptEventSourceName(event);
    if (worldSpawns !== null)
        worldSpawns.reset();
    counterChannels.resetAllCounts();
    generatorChannels.resetAllCounts();
    broadcastActionBar({ translate: 'commands.resettest.success.actionbar', with: [sourceName] });
});