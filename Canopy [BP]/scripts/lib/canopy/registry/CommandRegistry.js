import IPC from 'lib/ipc/ipc';
import Command from "../Command";

IPC.on('canopyExtension:registerCommand', (cmdData) => {
    if (typeof cmdData.description === 'string')
        cmdData.description = { text: cmdData.description };
    for (const helpEntry of cmdData.helpEntries) {
        if (typeof helpEntry.description === 'string')
            helpEntry.description = { text: helpEntry.description };
    }
    new Command(cmdData);
    // console.warn(`[Canopy] Registered command: ${cmdData.extensionName}:${cmdData.name}`);
});