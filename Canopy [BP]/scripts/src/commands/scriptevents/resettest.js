import { system } from "@minecraft/server";
import Utils from "include/utils";
import { channelMap as counterMap } from 'src/commands/counter';
import { channelMap as generatorMap } from 'src/commands/generator';
import { worldSpawns } from 'src/commands/spawn';

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:resettest') return;
    const sourceName = Utils.getScriptEventSourceName(event);
    if (worldSpawns !== null)
        worldSpawns.reset();
    counterMap.resetAll();
    generatorMap.resetAll();
    Utils.broadcastActionBar({ translate: 'commands.resettest.success.actionbar', with: [sourceName] });
});