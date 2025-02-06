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
    usage: 'counter <color/all/reset/realtime> [<mode>/reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: counterCommand,
    contingentRules: ['hopperCounters'],
    helpEntries: [
        { usage: 'counter <color>', description: { translate: 'commands.counter.query' } },
        { usage: 'counter [color/all] realtime', description: { translate: 'commands.counter.realtime' } },
        { usage: 'counter <color/all> <count/hr/min/sec>', description: { translate: 'commands.counter.mode' } },
        { usage: 'counter [color/all] reset', description: { translate: 'commands.counter.reset' } }
    ]
})

new Command({
    name: 'ct',
    description: { translate: 'commands.counter' },
    usage: 'ct <color/all/reset/realtime> [<mode>/reset/realtime]',
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
    
    if ((!argOne && !argTwo) || (argOne === 'all' && !argTwo))
        queryAll(sender);
    else if ((argOne === 'realtime') || (argOne === 'all' && argTwo === 'realtime'))
        queryAll(sender, { useRealTime: true });
    else if ((argOne === 'reset') || (argOne === 'all' && argTwo === 'reset'))
        resetAll(sender);
    else if (argOne === 'all' && CounterChannels.isValidMode(argTwo))
        modeAll(sender, argTwo);
    else if (CounterChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (CounterChannels.isValidColor(argOne) && argTwo === 'realtime')
        query(sender, argOne, { useRealTime: true });
    else if (CounterChannels.isValidColor(argOne) && argTwo === 'reset')
        reset(sender, argOne);
    else if (CounterChannels.isValidColor(argOne) && CounterChannels.isValidMode(argTwo))
        mode(sender, argOne, argTwo);
    else if (argOne && !CounterChannels.isValidColor(argOne))
        sender.sendMessage({ translate: 'commands.counter.channel.notfound', with: [argOne] });
    else
        cmd.sendUsage(sender);
}

function query(sender, color, { useRealTime = false } = {}) {
    sender.sendMessage(CounterChannels.getQueryOutput(color, useRealTime));
}

function queryAll(sender, { useRealTime = false } = {}) {
    sender?.sendMessage(CounterChannels.getAllQueryOutput(useRealTime));
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

function mode(sender, color, mode) {
    CounterChannels.setMode(color, mode);
    sender.sendMessage({ translate: 'commands.counter.mode', with: [Utils.formatColorStr(color), mode] });
    Utils.broadcastActionBar({ translate: 'commands.counter.mode.actionbar', with: [sender.name, Utils.formatColorStr(color), mode] }, sender);
}

function modeAll(sender, mode) {
    CounterChannels.setAllModes(mode);
    sender.sendMessage({ translate: 'commands.counter.mode.all', with: [mode] });
    Utils.broadcastActionBar({ translate: 'commands.counter.mode.all.actionbar', with: [sender.name, mode] }, sender);
}

export { query, queryAll };