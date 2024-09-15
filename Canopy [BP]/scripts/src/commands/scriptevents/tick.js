import { system, world } from "@minecraft/server";
import Utils from "stickycore/utils";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "canopy:tick") return;
    const message = event.message;
    const args = message.split(' ');
    const sourceName = Utils.getScriptEventSourceName(event);
    if (args[0] === "sleep" && Utils.isNumeric(args[1])) 
        tickSleep(sourceName, args[1]);
});

function tickSleep(sourceName, milliseconds) {
    if (milliseconds === null || milliseconds < 1) return;
    world.sendMessage(`§7[${sourceName}] Pausing the server for ${milliseconds} ms.`);
    let startTime = Date.now();
    let waitTime = 0;
    while (waitTime < milliseconds) {
        waitTime = Date.now() - startTime;
    }
}