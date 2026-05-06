import { Rules } from "../../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import { broadcastActionBar, getScriptEventSourceName, isNumeric } from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "canopy:tick") return;
    if (!Rules.getNativeValue('commandTick')) {
        broadcastActionBar({ translate: 'rules.generic.blocked', with: ['commandTick'] });
        return;
    }
    const message = event.message;
    const args = message.split(' ');
    const sourceName = getScriptEventSourceName(event);
    if (args[0] === "sleep" && isNumeric(args[1])) 
        tickSleep(sourceName, args[1]);
});

function tickSleep(sourceName, milliseconds) {
    if (milliseconds === null || milliseconds < 1) return;
    world.sendMessage({ translate: 'command.tick.sleep.success', with: [sourceName, String(milliseconds)] });
    const startTime = Date.now();
    let waitTime = 0;
    while (waitTime < milliseconds) 
        waitTime = Date.now() - startTime;
    
}