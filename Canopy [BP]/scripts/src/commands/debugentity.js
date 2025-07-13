import { VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from '@minecraft/server';
import { DebugDisplay } from "../classes/debugdisplay/DebugDisplay";
import { getTranslatedEntityList } from "../../include/utils";

export const DEBUG_ACTION = Object.freeze({
    Add: 'add',
    Remove: 'remove'
});


new VanillaCommand({
    name: 'canopy:debugentity',
    description: 'commands.debugentity',
    enums: [
        {name: 'canopy:debugAction', values: Object.values(DEBUG_ACTION)},
        {name: 'canopy:debugableProperty', values: DebugDisplay.getDebugableProperties()}
    ],
    mandatoryParameters: [
        {name: 'canopy:debugAction', type: CustomCommandParamType.Enum}, 
        {name: 'canopy:debugableProperty', type: CustomCommandParamType.Enum},
        {name: 'entity', type: CustomCommandParamType.EntitySelector}
    ],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    callback: debugEntityCommand
});

function debugEntityCommand(source, addOrRemove, property, entities) {
    if (!DebugDisplay.getDebugableProperties().includes(property))
        return { status: CustomCommandStatus.Failure, message: `commands.debugentity.invalidProperty` };
    if (addOrRemove === DEBUG_ACTION.Add)
        addPropertyToDebugDisplay(source, entities, property);
    else if (addOrRemove === DEBUG_ACTION.Remove)
        removePropertyFromDebugDisplay(source, entities, property);
    else
        return { status: CustomCommandStatus.Failure, message: `commands.debugentity.invalidAction` };
}

function addPropertyToDebugDisplay(source, entities, property) {
    for (const entity of entities) {
        let debugDisplay = DebugDisplay.getDebugDisplay(entity);
        if (!debugDisplay)
            debugDisplay = new DebugDisplay(entity);
        debugDisplay.addElement(property);
    }
    source.sendMessage(getSuccessMessage(`commands.debugentity.added`, property, entities));
}

function removePropertyFromDebugDisplay(source, entities, property) {
    for (const entity of entities) {
        const debugDisplay = DebugDisplay.getDebugDisplay(entity);
        if (!debugDisplay)
            continue;
        debugDisplay.removeElement(property);
        if (debugDisplay.getEnabledElements().length === 0)
            debugDisplay.destroy();
    }
    source.sendMessage(getSuccessMessage(`commands.debugentity.removed`, property, entities));
}

function getSuccessMessage(translationStr, property, entities) {
    const message = { rawtext: [{ translate: translationStr, with: [property, String(entities.length)] }] };
    message.rawtext.push(getTranslatedEntityList(entities));
    return message;
}
