import { system, world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';
import Utils from 'stickycore/utils';
import { DataTPS } from 'src/tps';

new Rule({
    category: 'Rules',
    identifier: 'commandTick',
    description: 'Enables tick command.'
});

const cmd = new Command({
    name: 'tick',
    description: 'Set and control the tick speed.',
    usage: `tick <mspt/step/reset/sleep> [steps/milliseconds]`,
    args: [
        { type: 'string|number', name: 'arg' },
        { type: 'number', name: 'steps' }
    ],
    callback: tickCommand,
    contingentRules: ['commandTick'],
    helpEntries: [
        { usage: 'tick <mspt>', description: 'Slows down the server tick speed to the specified mspt.' },
        { usage: 'tick step [steps]', description: 'Allows the server to run at normal speed for the specified amount of steps.' },
        { usage: 'tick reset', description: 'Resets the server tick speed to normal.' },
        { usage: 'tick sleep [milliseconds]', description: 'Pauses the server for the desired milliseconds.' }
    ]
});

let targetMSPT = 50.0;
let shouldStep = 0;

system.runInterval(() => {
    if (shouldStep > 0) {
        shouldStep--;
        if (shouldStep == 0) world.sendMessage('§7Tick step complete.');
        return;
    }
    tickSpeed(targetMSPT);
});

function tickCommand(sender, args) {
    if (!world.getDynamicProperty('commandTick')) return sender.sendMessage('§cThe commandTick feature is disabled.');
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
        return sender.sendMessage('§cMSPT cannot be less than 50.0.');
    targetMSPT = mspt;
    world.sendMessage(`§7${sender.name} set the tick speed to ${mspt} mspt.`);
    tickSpeed(mspt);
}

function tickReset(sender) {
    targetMSPT = 50.0;
    world.sendMessage(`§7${sender.name} reset the tick speed.`);
}

function tickStep(sender, steps) {
    if (targetMSPT === 50.0)
        return sender.sendMessage('§cCannot step ticks without setting a tick speed.');
    if (steps === null || steps < 1)
        shouldStep = 1;
    else
        shouldStep = steps;
    world.sendMessage(`§7${sender.name} stepping ${shouldStep} tick(s)...`);
}

function tickSleep(sender, milliseconds) {
    if (milliseconds === null || milliseconds < 1)
        return sender.sendMessage('§cInvalid sleep time.');
    world.sendMessage(`§7${sender.name} pausing the server for ${milliseconds} ms.`);
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
