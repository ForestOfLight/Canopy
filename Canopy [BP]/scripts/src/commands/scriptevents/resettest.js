import { system } from "@minecraft/server";
import Utils from "include/utils";
import CounterChannels from "../../classes/CounterChannels";
import GeneratorChannels from "../../classes/GeneratorChannels";
import { worldSpawns } from 'src/commands/spawn';

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:resettest') return;
    const sourceName = Utils.getScriptEventSourceName(event);
    if (worldSpawns !== null)
        worldSpawns.reset();
    CounterChannels.resetAllCounts();
    GeneratorChannels.resetAllCounts();
    Utils.broadcastActionBar({ translate: 'commands.resettest.success.actionbar', with: [sourceName] });
});