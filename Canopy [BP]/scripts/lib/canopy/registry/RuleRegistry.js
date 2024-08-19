import { system } from "@minecraft/server";
import Rule from "../Rule";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.sourceType !== 'Server' || event.id !== 'canopyExtension:registerRule') return;
    const message = event.message;
    const extensionName = message.split(' ')[0];
    let ruleData;
    try {
        ruleData = JSON.parse(message.slice(extensionName.length + 1));
    } catch (error) {
        console.warn(`[RuleRegistry] Failed to parse rule data: ${error}, ${event.message}`);
    }
    if (!ruleData) return;
    new Rule(ruleData);
    // console.warn(`[Canopy] Registered rule: ${ruleData.extensionName}:${ruleData.identifier}`);
}, { namespaces: ['canopyExtension']});