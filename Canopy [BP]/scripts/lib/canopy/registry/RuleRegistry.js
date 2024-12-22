import IPC from "lib/ipc/ipc";
import Rule from "../Rule";

IPC.on('canopyExtension:registerRule', (ruleData) => {
    if (typeof ruleData.description === 'string')
        ruleData.description = { text: ruleData.description };
    new Rule(ruleData);
    // console.warn(`[Canopy] Registered rule: ${ruleData.extensionName}:${ruleData.identifier}`);
});
