import { BlockCommandOrigin, EntityCommandOrigin, PlayerCommandOrigin, ServerCommandOrigin, VanillaCommand } from '../../lib/canopy/Canopy';
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from '@minecraft/server';
import { Profiler } from '../classes/Profiler';

export const TICK_ACTIONS = Object.freeze({
    MSPT: 'mspt',
    STEP: 'step',
    RESET: 'reset',
    SLEEP: 'sleep'
});

export const VANILLA_MSPT = 50.0;

export class TickCommand extends VanillaCommand {
    targetMSPT = VANILLA_MSPT;
    shouldStep = 0;

    constructor() {
        super({
            name: 'canopy:tick',
            description: 'commands.tick',
            enums: [{ name: 'canopy:tickAction', values: Object.values(TICK_ACTIONS) }],
            mandatoryParameters: [{ name: 'canopy:tickAction', type: CustomCommandParamType.Enum }],
            optionalParameters: [{ name: 'value', type: CustomCommandParamType.Integer }],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin, ServerCommandOrigin],
            cheatsRequired: true,
            callback: (origin, ...args) => this.tickCommand(origin, ...args),
            wikiDescription: 'Controls the server tick speed. Subcommands: mspt, step, reset, sleep.',
            subCommandWikiDescription: {
                mspt: `Slows the tick loop to the given milliseconds-per-tick value. Must be ${VANILLA_MSPT} or greater.`,
                step: 'Advances N ticks while the tick loop is slowed. Defaults to 1 step if omitted.',
                reset: `Restores tick speed to normal (${VANILLA_MSPT} MSPT).`,
                sleep: 'Busy-waits for the given number of milliseconds, blocking the tick thread.'
            }
        });
        system.runInterval(() => this.tryDecrementSteps());
    }

    tickCommand(origin, action, value) {
        if (value === void 0)
            value = 0;
        switch(action) {
            case TICK_ACTIONS.MSPT:
                return this.tickSlow(origin, value);
            case TICK_ACTIONS.STEP:
                return this.tickStep(origin, value);
            case TICK_ACTIONS.RESET:
                return this.tickReset(origin);
            case TICK_ACTIONS.SLEEP:
                return this.tickSleep(origin, value);
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidaction' };
        }
    }

    tickSlow(origin, mspt) {
        if (mspt < VANILLA_MSPT)
            return { status: CustomCommandStatus.Failure, message: 'commands.tick.mspt.fail' };
        this.targetMSPT = mspt;
        world.sendMessage({ translate: 'commands.tick.mspt.success', with: [origin.getSource().name, String(mspt)] });
        this.tickSpeed(mspt);
        return { status: CustomCommandStatus.Success };
    }

    tickReset(origin) {
        this.targetMSPT = VANILLA_MSPT;
        world.sendMessage({ translate: 'commands.tick.reset.success', with: [origin.getSource().name] });
        return { status: CustomCommandStatus.Success };
    }

    tickStep(origin, steps) {
        if (this.targetMSPT === VANILLA_MSPT) {
            origin.sendMessage({ translate: 'commands.tick.step.fail' });
            return { status: CustomCommandStatus.Success };
        }
        if (!steps || steps < 1)
            this.shouldStep = 1;
        else
            this.shouldStep = steps;
        world.sendMessage({ translate: 'commands.tick.step.start', with: [origin.getSource().name, String(this.shouldStep)] });
        return { status: CustomCommandStatus.Success };
    }

    tickSleep(origin, milliseconds) {
        if (!milliseconds || milliseconds < 1)
            return { status: CustomCommandStatus.Success, message: 'commands.tick.sleep.fail' };
        world.sendMessage({ translate: 'commands.tick.sleep.success', with: [origin.getSource().name, String(milliseconds)] });
        const startTime = Date.now();
        let waitTime = 0;
        while (waitTime < milliseconds)
            waitTime = Date.now() - startTime;
        return { status: CustomCommandStatus.Success };
    }

    tryDecrementSteps() {
        if (this.shouldStep > 0) {
            this.shouldStep--;
            if (this.shouldStep === 0)
                world.sendMessage({ translate: 'commands.tick.step.done' });
            return;
        }
        this.tickSpeed(this.targetMSPT);
    }

    tickSpeed(desiredMspt) {
        if (this.targetMSPT === VANILLA_MSPT)
            return;
        let currentMspt = Date.now() - Profiler.lastTickDate;
        while (currentMspt <= desiredMspt)
            currentMspt = Date.now() - Profiler.lastTickDate;
    }
}

export const tickCommand = new TickCommand();