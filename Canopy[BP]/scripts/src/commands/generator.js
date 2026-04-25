import { BooleanRule, Command } from "../../lib/canopy/Canopy";
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

const cmd = new Command({
    name: 'generator',
    description: { translate: 'commands.generator' },
    usage: 'generator <color/all/reset/realtime> [reset/realtime/remove]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: generatorCommand,
    contingentRules: ['hopperGenerators'],
    helpEntries: [
        { usage: 'generator', description: { translate: 'commands.generator.query.all' }, wikiDescription: 'Displays information about the item counts in each channel. This includes metrics like the total items and items per hour, and the same divided up into individual item types. Alias: **`./gt`**' },
        { usage: 'generator [color/all]', description: { translate: 'commands.generator.query' }, wikiDescription: 'Does the same as `./generator`, but displays info for only one channel. Using the `all` keyword has exactly the same behavior as `./generator`. Alias: **`./gt <color>`** This command can also be triggered with the vanilla command `/scriptevent canopy:generator [color]` (ie. in a command block).' },
        { usage: 'generator [color/all] realtime', description: { translate: 'commands.generator.realtime' }, wikiDescription: 'Displays information about the item counts using real-world time instead of Minecraft tick-based time to do rate calculations. Alias: **`./gt realtime`**, **`./gt <color|all> realtime`**' },
        { usage: 'generator [color/all] reset', description: { translate: 'commands.generator.reset' }, wikiDescription: 'Resets the count of all channels to zero and restarts the timer. Alias: **`./gt [color|all] reset`**. This command can also be triggered with the vanilla command `/scriptevent canopy:generator [color|all] reset` (ie. in a command block).' },
        { usage: 'generator [color/all remove', description: { translate: 'commands.counter.remove' }, wikiDescription: 'Removes all known hoppers in the specified channel or all channels. This will also reset the timer for that channel or all channels. Alias: **`./gt remove`**, **`./gt <color|all> remove`** This command can also be triggered with the vanilla command `/scriptevent canopy:generator [color|all] remove` (ie. in a command block).' }
    ]
});

new Command({
    name: 'gt',
    description: { translate: 'commands.generator' },
    usage: 'gt <color/all/reset/realtime> [reset/realtime/remove]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: generatorCommand,
    contingentRules: ['hopperGenerators'],
    helpHidden: true
});

function generatorCommand(sender, args) {
    const { argOne, argTwo } = args;

    if ((!argOne && !argTwo) || (argOne === 'all' && !argTwo))
        queryAll(sender);
    else if ((argOne === 'realtime') || (argOne === 'all' && argTwo === 'realtime'))
        queryAll(sender, { useRealTime: true });
    else if ((argOne === 'reset') || (argOne === 'all' && argTwo === 'reset'))
        resetAll(sender);
    else if ((argOne === 'remove') || (argOne === 'all' && argTwo === 'remove'))
        removeAll(sender);
    else if (generatorChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (generatorChannels.isValidColor(argOne) && argTwo === 'realtime')
        query(sender, argOne, { useRealTime: true });
    else if (generatorChannels.isValidColor(argOne) && argTwo === 'reset')
        reset(sender, argOne);
    else if (generatorChannels.isValidColor(argOne) && argTwo === 'remove')
        remove(sender, argOne);
    else if (argOne && !generatorChannels.isValidColor(argOne))
        sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [argOne] });
    else
        cmd.sendUsage(sender);
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