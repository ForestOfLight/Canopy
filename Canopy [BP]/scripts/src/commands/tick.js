import { system, world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';
import Utils from 'stickycore/utils';
import { DataTPS } from 'src/tps';

new Rule({
    category: 'Rules',
    identifier: 'commandTick',
    description: { translate: 'rules.commandTick' },
});

const cmd = new Command({
    name: 'tick',
    description: { translate: 'commands.tick' },
    usage: `tick <mspt/step/reset/sleep> [steps/milliseconds]`,
    args: [
        { type: 'string|number', name: 'arg' },
        { type: 'number', name: 'steps' }
    ],
    callback: tickCommand,
    contingentRules: ['commandTick'],
    helpEntries: [
        { usage: 'tick <mspt>', description: { translate: 'commands.tick.mspt' } },
        { usage: 'tick step [steps]', description: { translate: 'commands.tick.step' } },
        { usage: 'tick reset', description: { translate: 'commands.tick.reset' } },
        { usage: 'tick sleep [milliseconds]', description: { translate: 'commands.tick.sleep' } }
    ]
});

let targetMSPT = 50.0;
let shouldStep = 0;

system.runInterval(() => {
    if (shouldStep > 0) {
        shouldStep--;
        if (shouldStep == 0) 
            world.sendMessage({ translate: 'commands.tick.done.success' });
        return;
    }
    tickSpeed(targetMSPT);
});

function tickCommand(sender, args) {
    const { arg, steps } = args;

    if (arg === null)
        return cmd.sendUsage(sender);
    else if (arg === 'reset')
        return tickReset(sender);
    else if (arg === 'step')
        return tickStep(sender, steps);
    else if (arg === 'sleep')
        return tickSleep(sender, steps);
    else if (Utils.isNumeric(arg))
        return tickSlow(sender, arg);
    else
        return cmd.sendUsage(sender);
}

function tickSlow(sender, mspt) {
    if (mspt < 50.0)
        return sender.sendMessage({ translate: 'commands.tick.mspt.fail' });
    targetMSPT = mspt;
    world.sendMessage({ translate: 'commands.tick.mspt.success', with: [sender.name, String(mspt)] });
    tickSpeed(mspt);
}

function tickReset(sender) {
    targetMSPT = 50.0;
    world.sendMessage({ translate: 'commands.tick.reset.success', with: [sender.name] });
}

function tickStep(sender, steps) {
    if (targetMSPT === 50.0)
        return sender.sendMessage({ translate: 'commands.tick.step.fail' });
    if (steps === null || steps < 1)
        shouldStep = 1;
    else
        shouldStep = steps;
    world.sendMessage(``);
}

function tickSleep(sender, milliseconds) {
    if (milliseconds === null || milliseconds < 1)
        return sender.sendMessage({ translate: 'commands.tick.sleep.fail' });
    world.sendMessage({ translate: 'commands.tick.sleep.success', with: [sender.name, String(milliseconds)] });
    let startTime = Date.now();
    let waitTime = 0;
    while (waitTime < milliseconds) {
        waitTime = Date.now() - startTime;
    }
}

function tickSpeed(desiredMspt) {
    if (targetMSPT === 50.0) return;
    let currentMspt = Date.now() - DataTPS.lastTick;

    while (currentMspt <= desiredMspt) {
        currentMspt = Date.now() - DataTPS.lastTick;
    }
}
