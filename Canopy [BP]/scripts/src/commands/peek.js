import { VanillaCommand } from "../../lib/canopy/Canopy";
import { getRaycastResults, getClosestTarget, stringifyLocation } from "../../include/utils";
import { InventoryUI } from "../classes/InventoryUI";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player, system } from "@minecraft/server";

const MAX_DISTANCE = 6*16;
const currentQuery = {};

new VanillaCommand({
    name: 'canopy:peek',
    description: 'commands.peek',
    optionalParameters: [{ name: 'itemQuery', type: CustomCommandParamType.String }],
    permissionLevel: CommandPermissionLevel.Any,
    contingentRules: ['allowPeekInventory'],
    callback: peekCommand
});

function peekCommand(source, itemQuery) {
    if (!(source instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    updateQueryMap(source, itemQuery);
    const target = getTarget(source);
    if (!target)
        return void 0;
    showInventoryUI(source, target);
    return void 0;
}

function updateQueryMap(source, itemQuery) {
    const oldQuery = currentQuery[source.name];
    if ([null, void 0].includes(oldQuery) && !itemQuery)
        return;
    if (!itemQuery && ![null, void 0].includes(oldQuery)) {
        currentQuery[source.name] = null;
        source.sendMessage({ translate: 'commands.peek.query.cleared' });
        return;
    }
    currentQuery[source.name] = itemQuery;
    source.sendMessage({ translate: 'commands.peek.query.set', with: [itemQuery] });
}

function getTarget(source) {
    const {blockRayResult, entityRayResult} = getRaycastResults(source, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0])
        return source.sendMessage({ translate: 'generic.target.notfound' });
    return getClosestTarget(source, blockRayResult, entityRayResult);
}

function showInventoryUI(source, target) {
    const invUI = new InventoryUI(target);
    system.run(() => {
        try {
            invUI.show(source);
        } catch (error) {
            if (error.message.includes('entity may be unloaded or removed'))
                source.sendMessage({ translate: 'commands.peek.fail.unloaded', with: [stringifyLocation(target.location, 0)] });
            else if (error.message.includes('No inventory component found'))
                source.sendMessage({ translate: 'commands.peek.fail.noinventory', with: [target.typeId, stringifyLocation(target.location, 0)] });
            else
                new Error(`[Canopy] Error showing inventory UI:`, { cause: error });
        }
    });
}

export { currentQuery };
