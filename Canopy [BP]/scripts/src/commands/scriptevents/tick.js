import { system, world } from "@minecraft/server";
import Utils from "include/utils";
import { Rules } from "../../../lib/canopy/Canopy";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "canopy:tick") return;
    if (!Rules.getNativeValue('commandTick')) 
        return Utils.broadcastActionBar({ translate: 'rules.generic.blocked', with: ['commandTick'] });
    const message = event.message;
    const args = message.split(' ');
    const sourceName = Utils.getScriptEventSourceName(event);
    if (args[0] === "sleep" && Utils.isNumeric(args[1])) 
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