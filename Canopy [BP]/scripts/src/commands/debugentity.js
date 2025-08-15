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
        {name: 'entity', type: CustomCommandParamType.EntitySelector},
        {name: 'canopy:debugAction', type: CustomCommandParamType.Enum},
        {name: 'canopy:debugableProperty', type: CustomCommandParamType.Enum}
    ],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    callback: debugEntityCommand
});

function debugEntityCommand(origin, entities, addOrRemove, property) {
    if (!DebugDisplay.getDebugableProperties().includes(property))
        return { status: CustomCommandStatus.Failure, message: `commands.debugentity.invalidProperty` };
    if (addOrRemove === DEBUG_ACTION.Add)
        addPropertyToDebugDisplay(origin, entities, property);
    else if (addOrRemove === DEBUG_ACTION.Remove)
        removePropertyFromDebugDisplay(origin, entities, property);
    else
        return { status: CustomCommandStatus.Failure, message: `commands.debugentity.invalidAction` };
}

function addPropertyToDebugDisplay(origin, entities, property) {
    for (const entity of entities) {
        let debugDisplay = DebugDisplay.getDebugDisplay(entity);
        if (!debugDisplay)
            debugDisplay = new DebugDisplay(entity);
        debugDisplay.addElement(property);
    }
    origin.sendMessage(getSuccessMessage(`commands.debugentity.added`, property, entities));
}

function removePropertyFromDebugDisplay(origin, entities, property) {
    for (const entity of entities) {
        const debugDisplay = DebugDisplay.getDebugDisplay(entity);
        if (!debugDisplay)
            continue;
        debugDisplay.removeElement(property);
        if (debugDisplay.getEnabledElements().length === 0)
            debugDisplay.destroy();
    }
    origin.sendMessage(getSuccessMessage(`commands.debugentity.removed`, property, entities));
}

function getSuccessMessage(translationStr, property, entities) {
    const message = { rawtext: [{ translate: translationStr, with: [property, String(entities.length)] }] };
    message.rawtext.push(getTranslatedEntityList(entities));
    return message;
}
