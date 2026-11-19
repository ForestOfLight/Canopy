import { BooleanRule, PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { ITEM_COUNTER_COLORS } from "../classes/ItemCounterChannels";
import { generatorChannels } from "../classes/GeneratorChannels";
import { formatColorStr, broadcastActionBar } from "../../include/utils";

new BooleanRule({
    category: 'Rules',
    identifier: 'hopperGenerators',
    description: { translate: 'rules.hopperGenerators' },
    wikiDescription: 'Enables/disables the generator command and hopper generator functionality. Disabling this rule also resets all generators.',
    onEnableCallback: () => generatorChannels.enable(),
    onDisableCallback: () => generatorChannels.disable()
});



const GENERATOR_ACTIONS = Object.freeze({ RESET: 'reset', REALTIME: 'realtime', REMOVE: 'remove' });
const GENERATOR_TARGETS = Object.freeze({ ALL: 'all', ...GENERATOR_ACTIONS });

new VanillaCommand({
    name: 'canopy:generator',
    description: 'commands.generator',
    enums: [
        {
            name: 'canopy:generatorTarget',
            values: [...ITEM_COUNTER_COLORS, ...Object.values(GENERATOR_TARGETS)]
        },
        {
            name: 'canopy:generatorAction',
            values: Object.values(GENERATOR_ACTIONS)
        }
    ],
    optionalParameters: [
        {
            name: 'canopy:generatorTarget',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'canopy:generatorAction',
            type: CustomCommandParamType.Enum
        }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    contingentRules: ['hopperGenerators'],
    aliases: ['canopy:gt'],
    callback: (origin, argOne, argTwo) => {
        const sender = origin.getSource();
        system.run(() => generatorCommand(sender, {
            argOne: argOne ?? null,
            argTwo: argTwo ?? null
        }));
        return { status: CustomCommandStatus.Success };
    },
    wikiDescription: '',
    subCommandWikiDescription: {
        "": {
            description: 'Displays information about the item counts in each channel. This includes metrics like the total items and items per hour, and the same divided up into individual item types. Alias: **`/gt`**'
        },
        "<color|all>": {
            description: 'Does the same as `/generator`, but displays info for only one channel. Using the `all` keyword has exactly the same behavior as `/generator`. Alias: **`/gt <color>`** This command can also be triggered with the vanilla command `/scriptevent canopy:generator [color]` (ie. in a command block).'
        },
        "<color|all> realtime": {
            description: 'Displays information about the item counts using real-world time instead of Minecraft tick-based time to do rate calculations. Alias: **`/gt realtime`**, **`/gt <color|all> realtime`**'
        },
        "<color|all> reset": {
            description: 'Resets the count of all channels to zero and restarts the timer. Alias: **`/gt [color|all] reset`**. This command can also be triggered with the vanilla command `/scriptevent canopy:generator [color|all] reset` (ie. in a command block).'
        },
        "<color|all> remove": {
            description: 'Removes all known hoppers in the specified channel or all channels. This will also reset the timer for that channel or all channels. Alias: **`/gt remove`**, **`/gt <color|all> remove`** This command can also be triggered with the vanilla command `/scriptevent canopy:generator [color|all] remove` (ie. in a command block).'
        }
    }
});

function generatorCommand(sender, args) {
    const { argOne, argTwo } = args;

    if ((!argOne && !argTwo) || (argOne === GENERATOR_TARGETS.ALL && !argTwo))
        queryAll(sender);
    else if ((argOne === GENERATOR_ACTIONS.REALTIME) || (argOne === GENERATOR_TARGETS.ALL && argTwo === GENERATOR_ACTIONS.REALTIME))
        queryAll(sender, { useRealTime: true });
    else if ((argOne === GENERATOR_ACTIONS.RESET) || (argOne === GENERATOR_TARGETS.ALL && argTwo === GENERATOR_ACTIONS.RESET))
        resetAll(sender);
    else if ((argOne === GENERATOR_ACTIONS.REMOVE) || (argOne === GENERATOR_TARGETS.ALL && argTwo === GENERATOR_ACTIONS.REMOVE))
        removeAll(sender);
    else if (generatorChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (generatorChannels.isValidColor(argOne) && argTwo === GENERATOR_ACTIONS.REALTIME)
        query(sender, argOne, { useRealTime: true });
    else if (generatorChannels.isValidColor(argOne) && argTwo === GENERATOR_ACTIONS.RESET)
        reset(sender, argOne);
    else if (generatorChannels.isValidColor(argOne) && argTwo === GENERATOR_ACTIONS.REMOVE)
        remove(sender, argOne);
    else if (argOne && !generatorChannels.isValidColor(argOne))
        sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [argOne] });
    else
        sendGeneratorUsage(sender);
}

function sendGeneratorUsage(sender) {
    sender.sendMessage({
        translate: 'commands.generic.usage',
        with: ['/canopy:generator <color/all/reset/realtime/remove> [reset/realtime/remove]']
    });
}

function reset(sender, color) {
    generatorChannels.resetCounts(color);
    sender.sendMessage({ translate: 'commands.generator.reset.single', with: [formatColorStr(color)] });
    broadcastActionBar({ translate: 'commands.generator.reset.single.actionbar', with: [sender.name, formatColorStr(color)]}, sender);
}

function resetAll(sender) {
    generatorChannels.resetAllCounts();
    sender.sendMessage({ translate: 'commands.generator.reset.all' });
    broadcastActionBar({ translate: 'commands.generator.reset.all.actionbar', with: [sender.name] }, sender);
}

function query(sender, color, { useRealTime = false } = {}) {
    sender.sendMessage(generatorChannels.getQueryOutput(color, useRealTime));
}

function queryAll(sender, { useRealTime = false } = {}) {
    sender?.sendMessage(generatorChannels.getAllQueryOutput(useRealTime));
}

function remove(sender, color) {
    generatorChannels.removeHoppers(color);
    sender.sendMessage({ translate: 'commands.generator.remove.single', with: [formatColorStr(color)] });
    broadcastActionBar({ translate: 'commands.generator.remove.single.actionbar', with: [sender.name, formatColorStr(color)] }, sender);
}

function removeAll(sender) {
    generatorChannels.removeAllHoppers();
    sender.sendMessage({ translate: 'commands.generator.remove.all' });
    broadcastActionBar({ translate: 'commands.generator.remove.all.actionbar', with: [sender.name] }, sender);
}

export { query, queryAll };
