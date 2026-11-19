import { BooleanRule, PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { ITEM_COUNTER_COLORS } from "../classes/ItemCounterChannels";
import { counterChannels } from "../classes/CounterChannels";
import { broadcastActionBar, formatColorStr } from "../../include/utils";

new BooleanRule({
    category: 'Rules',
    identifier: 'hopperCounters',
    description: { translate: 'rules.hopperCounters' },
    wikiDescription: 'Enables/disables the counter command and hopper counter functionality. Disabling this rule also resets all counters.',
    onEnableCallback: () => counterChannels.enable(),
    onDisableCallback: () => counterChannels.disable()
});



const COUNTER_MODES = Object.freeze({ COUNT: 'count', HR: 'hr', MIN: 'min', SEC: 'sec' });
const COUNTER_ACTIONS = Object.freeze({ ...COUNTER_MODES, RESET: 'reset', REALTIME: 'realtime', REMOVE: 'remove' });
const COUNTER_TARGETS = Object.freeze({ ALL: 'all', ...COUNTER_ACTIONS });

new VanillaCommand({
    name: 'canopy:counter',
    description: 'commands.counter',
    enums: [
        {
            name: 'canopy:counterTarget',
            values: [...ITEM_COUNTER_COLORS, ...Object.values(COUNTER_TARGETS)]
        },
        {
            name: 'canopy:counterAction',
            values: Object.values(COUNTER_ACTIONS)
        }
    ],
    optionalParameters: [
        {
            name: 'canopy:counterTarget',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'canopy:counterAction',
            type: CustomCommandParamType.Enum
        }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    contingentRules: ['hopperCounters'],
    aliases: ['canopy:ct'],
    callback: (origin, argOne, argTwo) => {
        const sender = origin.getSource();
        system.run(() => counterCommand(sender, {
            argOne: argOne ?? null,
            argTwo: argTwo ?? null
        }));
        return { status: CustomCommandStatus.Success };
    },
    wikiDescription: '',
    subCommandWikiDescription: {
        "": {
            description: 'Displays information about the item counts in each channel. This includes metrics like the total items and items per hour, and the same divided up into individual item types. Alias: **`/ct`**'
        },
        "<color|all>": {
            description: 'Does the same as `/counter`, but displays info for only one channel. Using the `all` keyword has exactly the same behavior as `/counter`. Alias: **`/ct <color>`** This command can also be triggered with the vanilla command `/scriptevent canopy:counter [color]` (ie. in a command block).'
        },
        "<color|all> realtime": {
            description: 'Displays information about the item counts using real-world time instead of Minecraft tick-based time to do rate calculations. Alias: **`/ct realtime`**, **`/ct <color|all> realtime`**'
        },
        "<color|all> <count|hr|min|sec>": {
            description: 'Changes the mode of a channel while tracking hopper counters in the InfoDisplay. `count` displays a count of every item that passes through. `hr`, `min`, `sec` displays the number of items per hour, minute, and second respectively. Alias: **`/ct <color|all> <count|hr|min|sec>`**'
        },
        "<color|all> reset": {
            description: 'Resets the count of all channels to zero and restarts the timer. Alias: **`/ct [color|all] reset`**. This command can also be triggered with the vanilla command `/scriptevent canopy:counter [color|all] reset` (ie. in a command block).'
        },
        "<color|all> remove": {
            description: 'Removes all known hoppers in the specified channel or all channels. This will also reset the timer for that channel or all channels. Alias: **`/ct remove`**, **`/ct <color|all> remove`** This command can also be triggered with the vanilla command `/scriptevent canopy:counter [color|all] remove` (ie. in a command block).'
        }
    }
});

function counterCommand(sender, args) {
    const { argOne, argTwo } = args;

    if ((!argOne && !argTwo) || (argOne === COUNTER_TARGETS.ALL && !argTwo))
        queryAll(sender);
    else if ((argOne === COUNTER_ACTIONS.REALTIME) || (argOne === COUNTER_TARGETS.ALL && argTwo === COUNTER_ACTIONS.REALTIME))
        queryAll(sender, { useRealTime: true });
    else if ((argOne === COUNTER_ACTIONS.RESET) || (argOne === COUNTER_TARGETS.ALL && argTwo === COUNTER_ACTIONS.RESET))
        resetAll(sender);
    else if (counterChannels.isValidMode(argOne))
        setAllMode(sender, argOne);
    else if (argOne === COUNTER_TARGETS.ALL && counterChannels.isValidMode(argTwo))
        setAllMode(sender, argTwo);
    else if ((argOne === COUNTER_ACTIONS.REMOVE) || (argOne === COUNTER_TARGETS.ALL && argTwo === COUNTER_ACTIONS.REMOVE))
        removeAll(sender);
    else if (counterChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (counterChannels.isValidColor(argOne) && argTwo === COUNTER_ACTIONS.REALTIME)
        query(sender, argOne, { useRealTime: true });
    else if (counterChannels.isValidColor(argOne) && argTwo === COUNTER_ACTIONS.RESET)
        reset(sender, argOne);
    else if (counterChannels.isValidColor(argOne) && counterChannels.isValidMode(argTwo))
        setMode(sender, argOne, argTwo);
    else if (counterChannels.isValidColor(argOne) && argTwo === COUNTER_ACTIONS.REMOVE)
        remove(sender, argOne);
    else if (argOne && !counterChannels.isValidColor(argOne))
        sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [argOne] });
    else
        sendCounterUsage(sender);
}

function sendCounterUsage(sender) {
    sender.sendMessage({
        translate: 'commands.generic.usage',
        with: ['/canopy:counter <color/all/reset/realtime> [<mode>/reset/realtime/remove]']
    });
}

function query(sender, color, { useRealTime = false } = {}) {
    sender.sendMessage(counterChannels.getQueryOutput(color, useRealTime));
}

function queryAll(sender, { useRealTime = false } = {}) {
    sender?.sendMessage(counterChannels.getAllQueryOutput(useRealTime));
}

function reset(sender, color) {
    counterChannels.resetCounts(color);
    sender.sendMessage({ translate: 'commands.counter.reset.single', with: [formatColorStr(color)] });
    broadcastActionBar({ translate: 'commands.counter.reset.single.actionbar', with: [sender.name, formatColorStr(color)]}, sender);
}

function resetAll(sender) {
    counterChannels.resetAllCounts();
    sender.sendMessage({ translate: 'commands.counter.reset.all' });
    broadcastActionBar({ translate: 'commands.counter.reset.all.actionbar', with: [sender.name] }, sender);
}

function setMode(sender, color, mode) {
    counterChannels.setMode(color, mode);
    sender.sendMessage({ translate: 'commands.counter.mode.single', with: [formatColorStr(color), mode] });
    broadcastActionBar({ translate: 'commands.counter.mode.single.actionbar', with: [sender.name, formatColorStr(color), mode] }, sender);
}

function setAllMode(sender, mode) {
    counterChannels.setAllModes(mode);
    sender.sendMessage({ translate: 'commands.counter.mode.all', with: [mode] });
    broadcastActionBar({ translate: 'commands.counter.mode.all.actionbar', with: [sender.name, mode] }, sender);
}

function removeAll(sender) {
    counterChannels.removeAllHoppers();
    sender.sendMessage({ translate: 'commands.counter.remove.all' });
    broadcastActionBar({ translate: 'commands.counter.remove.all.actionbar', with: [sender.name] }, sender);
}

function remove(sender, color) {
    counterChannels.removeHoppers(color);
    sender.sendMessage({ translate: 'commands.counter.remove.single', with: [formatColorStr(color)] });
    broadcastActionBar({ translate: 'commands.counter.remove.single.actionbar', with: [sender.name, formatColorStr(color)] }, sender);
}

export { query, queryAll };
