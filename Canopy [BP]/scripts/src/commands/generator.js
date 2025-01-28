import { Rule, Command } from "../../lib/canopy/Canopy";
import GeneratorChannels from "../classes/GeneratorChannels";
import Utils from "../../include/utils";

new Rule({
    category: 'Rules',
    identifier: 'hopperGenerators',
    description: { translate: 'rules.hopperGenerators' }
});

const cmd = new Command({
    name: 'generator',
    description: { translate: 'commands.generator' },
    usage: 'generator <color/all/reset/realtime> [reset/realtime]',
    args: [
        { type: 'string', name: 'argOne' },
        { type: 'string', name: 'argTwo' }
    ],
    callback: generatorCommand,
    contingentRules: ['hopperGenerators'],
    helpEntries: [
        { usage: 'generator <color>', description: { translate: 'commands.generator.query' } },
        { usage: 'generator [color] realtime', description: { translate: 'commands.generator.realtime' } },
        { usage: 'generator [color] reset', description: { translate: 'commands.generator.reset' } }
    ]
});

new Command({
    name: 'gt',
    description: { translate: 'commands.generator' },
    usage: 'gt <color/all/reset/realtime> [reset/realtime]',
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

    if (argOne !== null && !GeneratorChannels.isValidColor(argOne) && argOne !== 'reset' && argOne !== 'realtime' && argOne !== 'all') 
        return sender.sendMessage({ translate: 'commands.generator.channel.notfound', with: [argOne] });
    

    if (argOne === 'reset')
        resetAll(sender);
    else if (argOne === 'realtime')
        queryAll(sender, { useRealTime: true });
    else if (GeneratorChannels.isValidColor(argOne) && !argTwo)
        query(sender, argOne);
    else if (!argOne && !argTwo || argOne === 'all' && !argTwo)
        queryAll(sender);
    else if (argOne && argTwo === 'realtime')
        query(sender, argOne, { useRealTime: true });
    else if (argOne && argTwo === 'reset')
        reset(sender, argOne);
    else
        cmd.sendUsage(sender);
}

function reset(sender, color) {
    GeneratorChannels.resetCounts(color);
    sender.sendMessage({ translate: 'commands.generator.reset.single', with: [Utils.formatColorStr(color)] });
    Utils.broadcastActionBar({ translate: 'commands.generator.reset.single.actionbar', with: [sender.name, Utils.formatColorStr(color)]}, sender);
}

function resetAll(sender) {
    GeneratorChannels.resetAllCounts();
    sender.sendMessage({ translate: 'commands.generator.reset.all' });
    Utils.broadcastActionBar({ translate: 'commands.generator.reset.all.actionbar', with: [sender.name] }, sender);
}

function query(sender, color, { useRealTime = false } = {}) {
    sender.sendMessage(GeneratorChannels.getQueryOutput(color, useRealTime));
}

function queryAll(sender, { useRealTime = false } = {}) {
    sender?.sendMessage(GeneratorChannels.getAllQueryOutput(useRealTime));
}

export { query, queryAll };