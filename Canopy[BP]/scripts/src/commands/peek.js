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
    wikiDescription: 'Arms a peek for your next interaction: look at a block or entity up to 96 blocks away and interact to open a mirrored container, or sneak and interact to see the second half of a larger container. Interacting with anything that is not a container cancels the peek, and the arming expires after ten seconds. Requires creative mode and operator permissions. Using the "search term" argument will highlight any items that include your search term in your InfoDisplay.'
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
    if (!PeekProxyManager.isOperator(source)) {
        source.sendMessage({ translate: 'commands.peek.fail.notoperator' });
        return;
    }
    if (!PeekProxyManager.isCreative(source)) {
        source.sendMessage({ translate: 'commands.peek.fail.notcreative' });
        return;
    }
    peekProxyManager.armFromCommand(source);
    source.sendMessage({ translate: 'commands.peek.armed' });
}

export { currentQuery };
