import { Rule, Command } from "../../lib/canopy/Canopy";
import CounterChannels from "../classes/CounterChannels";
import Utils from "../../include/utils";

new Rule({
    category: 'Rules',
    identifier: 'hopperCounters',
    description: { translate: 'rules.hopperCounters' }
})

const cmd = new Command({
    name: 'counter',
    description: { translate: 'commands.counter' },
    usage: 'counter <color/all/reset/realtime> [mode/reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpEntries: [
        { usage: 'counter <color>', description: { translate: 'commands.counter.query' } },
        { usage: 'counter [color] realtime', description: { translate: 'commands.counter.realtime' } },
        { usage: 'counter <color/all> <mode>', description: { translate: 'commands.counter.mode' } },
        { usage: 'counter [color] reset', description: { translate: 'commands.counter.reset' } }
    ]
})

new Command({
    name: 'ct',
    description: { translate: 'commands.counter' },
    usage: 'ct <color/all/reset/realtime> [mode/reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpHidden: true
})

function counterCommand(sender, args) {
    const { argOne, argTwo } = args;
    
    if (argOne === 'reset')
        resetAll(sender);
    else if (argOne === 'realtime')
        queryAll(sender, { useRealTime: true });
    else if (CounterChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (!argOne && !argTwo || argOne === 'all' && !argTwo)
        queryAll(sender);
    else if (argOne && argTwo === 'realtime')
        query(sender, argOne, { useRealTime: true });
    else if (argOne && argTwo === 'reset')
        reset(sender, argOne);
    else if (argOne && !CounterChannels.isValidColor(argOne))
        sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [argOne] });
    else
        cmd.sendUsage(sender);
}

function reset(sender, color) {
    CounterChannels.resetCounts(color);
    sender.sendMessage({ translate: 'commands.counter.reset.single', with: [Utils.formatColorStr(color)] });
    Utils.broadcastActionBar({ translate: 'commands.counter.reset.single.actionbar', with: [sender.name, Utils.formatColorStr(color)]}, sender);
}

function resetAll(sender) {
    CounterChannels.resetAllCounts();
    sender.sendMessage({ translate: 'commands.counter.reset.all' });
    Utils.broadcastActionBar({ translate: 'commands.counter.reset.all.actionbar', with: [sender.name] }, sender);
}

function query(sender, color, { useRealTime = false } = {}) {
    sender.sendMessage(CounterChannels.getQueryOutput(color, useRealTime));
}

function queryAll(sender, { useRealTime = false } = {}) {
    sender?.sendMessage(CounterChannels.getAllQueryOutput(useRealTime));
}

export { query, queryAll };