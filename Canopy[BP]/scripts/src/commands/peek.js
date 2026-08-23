import { VanillaCommand, PlayerCommandOrigin } from "../../lib/canopy/Canopy";
import { PeekProxyManager, peekProxyManager } from "../classes/peek/PeekProxyManager";
import { CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";

const currentQuery = {};

new VanillaCommand({
    name: 'canopy:peek',
    description: 'commands.peek',
    optionalParameters: [{ name: 'itemQuery', type: CustomCommandParamType.String }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    contingentRules: ['allowPeekInventory'],
    callback: peekCommand,
    wikiDescription: `Arms a peek for your next interaction. Interact with a block or entity that has a container up to ${PeekProxyManager.COMMAND_RANGE} blocks away to open a mirrored container. `
        + `Only your next interaction is armed, and after 10 seconds, interactions will be disarmed. `
        + `Using the "search term" argument will highlight any items that include your search term in your InfoDisplay.`
});

function peekCommand(origin, itemQuery) {
    const player = origin.getSource();
    updateQueryMap(player, itemQuery);
    armLongRangePeek(player);
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

function armLongRangePeek(source) {
    if (!PeekProxyManager.isCreative(source)) {
        source.sendMessage({ translate: 'commands.peek.fail.notcreative' });
        return;
    }
    peekProxyManager.armFromCommand(source);
    source.sendMessage({ translate: 'commands.peek.armed' });
}

export { currentQuery };
