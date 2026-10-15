import { BooleanRule, PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
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

const GENERATOR_COLORS = Object.freeze([
    'white', 'light_gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow',
    'lime', 'green', 'cyan', 'light_blue', 'blue', 'purple', 'magenta', 'pink'
]);

const GENERATOR_TARGETS = Object.freeze([
    ...GENERATOR_COLORS,
    'all',
    'reset',
    'realtime',
    'remove'
]);

const GENERATOR_ACTIONS = Object.freeze([
    'reset',
    'realtime',
    'remove'
]);

new VanillaCommand({
    name: 'canopy:generator',
    description: 'commands.generator',
    enums: [
        {
            name: 'canopy:generatorTarget',
            values: GENERATOR_TARGETS
        },
        {
            name: 'canopy:generatorAction',
            values: GENERATOR_ACTIONS
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
    wikiDescription: 'Displays and manages hopper generator channels.'
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
