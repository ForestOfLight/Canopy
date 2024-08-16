import { system } from "@minecraft/server";
import Command from "../Command";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.sourceType !== 'Server' || event.id !== 'canopyExtension:registerCommand') return;
    const message = event.message;
    const extensionName = message.split(' ')[0];
    let cmdData;
    try {
        cmdData = JSON.parse(message.slice(extensionName.length + 1));
    } catch (error) {
        console.warn(`[CommandRegistry] Failed to parse command data: ${error}, ${event.message}`);
    }
    if (!cmdData) return;
    new Command(cmdData);
    console.warn(`[Canopy] Registered command: ${cmdData.extensionName}:${cmdData.name}`);
}, { namespaces: ['canopyExtension']});