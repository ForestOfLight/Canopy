import Command from 'stickycore/command'
import Utils from 'stickycore/utils'
import { DataTPS } from 'src/tps'
import * as mc from '@minecraft/server'

let currentTickSpeed = 50.0;
let shouldReset = false;
let shouldStep = 0;

mc.system.runInterval(() => {
    if (shouldStep > 0) {
        shouldStep--;
        if (shouldStep == 0)
            mc.world.sendMessage('§7Completed tick step.');
        return;
    }
    tickSpeed(currentTickSpeed);
});

new Command()
    .setName('tick')
    .addArgument('string|number', 'arg')
    .addArgument('number', 'steps')
    .setCallback(tickCommand)
    .build()

function tickCommand(sender, args) {
    const { arg, steps } = args;

    if (arg === null)
        return sender.sendMessage('§cUsage: ./tick <mspt> OR ./tick step [steps] OR ./tick reset');
    else if (arg === 'reset')
        return tickReset(sender);
    else if (arg === 'step')
        return tickStep(sender, steps);
    else if (Utils.isNumeric(arg))
        return tickSlow(sender, arg);
    els
        return sender.sendMessage('§cUsage: ./tick <mspt> OR ./tick step [steps] OR ./tick reset');
}

function tickSlow(sender, mspt) {
    if (mspt < 50.0)
        return sender.sendMessage('§cMSPT cannot be less than 50.0.');
    else if (mspt === 50.0)
        return mc.world.sendMessage(`§7[${sender.name}] Reset tick speed.`);
    currentTickSpeed = mspt;
    mc.world.sendMessage(`§7[${sender.name}] Tick speed set to ${mspt} mspt.`);
    tickSpeed(mspt);
}

function tickReset(sender) {
    shouldReset = true;
    currentTickSpeed = 50.0;
    mc.world.sendMessage('§7Reset tick speed.');
}

function tickStep(sender, steps) {
    if (currentTickSpeed === 50.0)
        return sender.sendMessage('§cCannot step ticks without setting a tick speed.');
    if (steps === null || steps < 1)
        shouldStep = 1;
    else
        shouldStep = steps;
    mc.world.sendMessage(`§[${sender.name}] Stepping ${shouldStep} tick(s)...`);
}

function tickSpeed(desiredMspt) {
    if (currentTickSpeed === 50.0) return;
    let currentMspt = Date.now() - DataTPS.lastTick;

    while (currentMspt <= desiredMspt) {
        currentMspt = Date.now() - DataTPS.lastTick;
    }
}
