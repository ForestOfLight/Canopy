import { VanillaCommand } from '../../lib/canopy/Canopy';
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from '@minecraft/server';
import { Profiler } from '../classes/Profiler';

new VanillaCommand({
    name: 'canopy:tick',
    description: 'commands.tick',
    enums: [{ name: 'canopy:tickAction', values: ['mspt', 'step', 'reset', 'sleep'] }],
    mandatoryParameters: [{ name: 'action', type: 'canopy:tickAction' }],
    optionalParameters: [{ name: 'value', type: CustomCommandParamType.Integer }],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    callback: tickCommand,
    wikiDescription: 'Controls the server tick speed. Subcommands: mspt, step, reset, sleep.',
    subCommandWikiDescription: {
        mspt: 'Slows the tick loop to the given milliseconds-per-tick value. Must be 50 or greater.',
        step: 'Advances N ticks while the tick loop is slowed. Defaults to 1 step if omitted.',
        reset: 'Restores tick speed to normal (50 MSPT).',
        sleep: 'Busy-waits for the given number of milliseconds, blocking the tick thread.'
    }
});

let targetMSPT = 50.0;
let shouldStep = 0;

system.runInterval(() => {
    if (shouldStep > 0) {
        shouldStep--;
        if (shouldStep === 0)
            world.sendMessage({ translate: 'commands.tick.step.done' });
        return;
    }
    tickSpeed(targetMSPT);
});

function tickCommand(origin, action, value) {
    if (action === 'mspt')
        return tickSlow(origin, value);
    else if (action === 'step')
        return tickStep(origin, value);
    else if (action === 'reset')
        return tickReset(origin);
    else if (action === 'sleep')
        return tickSleep(origin, value);
}

function tickSlow(origin, mspt) {
    if (mspt < 50.0) {
        origin.sendMessage({ translate: 'commands.tick.mspt.fail' });
        return { status: CustomCommandStatus.Success };
    }
    targetMSPT = mspt;
    world.sendMessage({ translate: 'commands.tick.mspt.success', with: [origin.getSource().name, String(mspt)] });
    tickSpeed(mspt);
    return { status: CustomCommandStatus.Success };
}

function tickReset(origin) {
    targetMSPT = 50.0;
    world.sendMessage({ translate: 'commands.tick.reset.success', with: [origin.getSource().name] });
    return { status: CustomCommandStatus.Success };
}

function tickStep(origin, steps) {
    if (targetMSPT === 50.0) {
        origin.sendMessage({ translate: 'commands.tick.step.fail' });
        return { status: CustomCommandStatus.Success };
    }
    if (!steps || steps < 1)
        shouldStep = 1;
    else
        shouldStep = steps;
    world.sendMessage({ translate: 'commands.tick.step.start', with: [origin.getSource().name, String(shouldStep)] });
    return { status: CustomCommandStatus.Success };
}

function tickSleep(origin, milliseconds) {
    if (!milliseconds || milliseconds < 1) {
        origin.sendMessage({ translate: 'commands.tick.sleep.fail' });
        return { status: CustomCommandStatus.Success };
    }
    world.sendMessage({ translate: 'commands.tick.sleep.success', with: [origin.getSource().name, String(milliseconds)] });
    const startTime = Date.now();
    let waitTime = 0;
    while (waitTime < milliseconds)
        waitTime = Date.now() - startTime;
    return { status: CustomCommandStatus.Success };
}

function tickSpeed(desiredMspt) {
    if (targetMSPT === 50.0) return;
    let currentMspt = Date.now() - Profiler.lastTickDate;
    while (currentMspt <= desiredMspt)
        currentMspt = Date.now() - Profiler.lastTickDate;
}
