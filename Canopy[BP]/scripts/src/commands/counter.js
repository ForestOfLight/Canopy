import { BooleanRule, PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
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

const COUNTER_COLORS = Object.freeze([
    'white', 'light_gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow',
    'lime', 'green', 'cyan', 'light_blue', 'blue', 'purple', 'magenta', 'pink'
]);

const COUNTER_MODES = Object.freeze([
    'count', 'hr', 'min', 'sec'
]);

const COUNTER_TARGETS = Object.freeze([
    ...COUNTER_COLORS,
    'all',
    'reset',
    'realtime',
    'remove',
    ...COUNTER_MODES
]);

const COUNTER_ACTIONS = Object.freeze([
    ...COUNTER_MODES,
    'reset',
    'realtime',
    'remove'
]);

new VanillaCommand({
    name: 'canopy:counter',
    description: 'commands.counter',
    enums: [
        {
            name: 'canopy:counterTarget',
            values: COUNTER_TARGETS
        },
        {
            name: 'canopy:counterAction',
            values: COUNTER_ACTIONS
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
    wikiDescription: 'Displays and manages hopper counter channels.'
});

function counterCommand(sender, args) {
    const { argOne, argTwo } = args;

    if ((!argOne && !argTwo) || (argOne === 'all' && !argTwo))
        queryAll(sender);
    else if ((argOne === 'realtime') || (argOne === 'all' && argTwo === 'realtime'))
        queryAll(sender, { useRealTime: true });
    else if ((argOne === 'reset') || (argOne === 'all' && argTwo === 'reset'))
        resetAll(sender);
    else if (counterChannels.isValidMode(argOne))
        setAllMode(sender, argOne);
    else if (argOne === 'all' && counterChannels.isValidMode(argTwo))
        setAllMode(sender, argTwo);
    else if ((argOne === 'remove') || (argOne === 'all' && argTwo === 'remove'))
        removeAll(sender);
    else if (counterChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (counterChannels.isValidColor(argOne) && argTwo === 'realtime')
        query(sender, argOne, { useRealTime: true });
    else if (counterChannels.isValidColor(argOne) && argTwo === 'reset')
        reset(sender, argOne);
    else if (counterChannels.isValidColor(argOne) && counterChannels.isValidMode(argTwo))
        setMode(sender, argOne, argTwo);
    else if (counterChannels.isValidColor(argOne) && argTwo === 'remove')
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
