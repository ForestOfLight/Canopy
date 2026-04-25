import { BooleanRule, Command } from "../../lib/canopy/Canopy";
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

const cmd = new Command({
    name: 'counter',
    description: { translate: 'commands.counter' },
    usage: 'counter <color/all/reset/realtime> [<mode>/reset/realtime/remove]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpEntries: [
        { usage: 'counter', description: { translate: 'commands.counter.query.all' }, wikiDescription: 'Displays information about the item counts in each channel. This includes metrics like the total items and items per hour, and the same divided up into individual item types. Alias: **`./ct`**' },
        { usage: 'counter [color/all]', description: { translate: 'commands.counter.query' }, wikiDescription: 'Does the same as `./counter`, but displays info for only one channel. Using the `all` keyword has exactly the same behavior as `./counter`. Alias: **`./ct <color>`** This command can also be triggered with the vanilla command `/scriptevent canopy:counter [color]` (ie. in a command block).' },
        { usage: 'counter [color/all] realtime', description: { translate: 'commands.counter.realtime' }, wikiDescription: 'Displays information about the item counts using real-world time instead of Minecraft tick-based time to do rate calculations. Alias: **`./ct realtime`**, **`./ct <color|all> realtime`**' },
        { usage: 'counter [color/all] <count/hr/min/sec>', description: { translate: 'commands.counter.mode' }, wikiDescription: 'Changes the mode of a channel while tracking hopper counters in the InfoDisplay. `count` displays a count of every item that passes through. `hr`, `min`, `sec` displays the number of items per hour, minute, and second respectively. Alias: **`./ct <color|all> <count|hr|min|sec>`**' },
        { usage: 'counter [color/all] reset', description: { translate: 'commands.counter.reset' }, wikiDescription: 'Resets the count of all channels to zero and restarts the timer. Alias: **`./ct [color|all] reset`**. This command can also be triggered with the vanilla command `/scriptevent canopy:counter [color|all] reset` (ie. in a command block).' },
        { usage: 'counter [color/all] remove', description: { translate: 'commands.counter.remove' }, wikiDescription: 'Removes all known hoppers in the specified channel or all channels. This will also reset the timer for that channel or all channels. Alias: **`./ct remove`**, **`./ct <color|all> remove`** This command can also be triggered with the vanilla command `/scriptevent canopy:counter [color|all] remove` (ie. in a command block).' }
    ]
});

new Command({
    name: 'ct',
    description: { translate: 'commands.counter' },
    usage: 'ct <color/all/reset/realtime> [<mode>/reset/realtime/remove]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpHidden: true
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
        cmd.sendUsage(sender);
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