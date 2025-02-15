import { system } from "@minecraft/server";
import { getScriptEventSourceName, broadcastActionBar } from "../../../include/utils";
import CounterChannels from "../../classes/CounterChannels";
import GeneratorChannels from "../../classes/GeneratorChannels";
import { worldSpawns } from "../../commands/spawn";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:resettest') return;
    const sourceName = getScriptEventSourceName(event);
    if (worldSpawns !== null)
        worldSpawns.reset();
    CounterChannels.resetAllCounts();
    GeneratorChannels.resetAllCounts();
    broadcastActionBar({ translate: 'commands.resettest.success.actionbar', with: [sourceName] });
});