import { system, world, TicksPerSecond } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export class BlockBreakSpeed extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'blockBreakSpeed';
    }

    player;
    #trackedTickCount;
    #blockBrokenHistory = [];
    #runner = void 0;

    constructor(player, displayLine) {
        const trackedTickCount = 100;
        const ruleData = { 
            description: { translate: 'rules.infoDisplay.blockBreakSpeed', with: [String(trackedTickCount), String((trackedTickCount / 20).toFixed(0))] }, 
            wikiDescription: `Shows your average blocks broken per second over the last ${trackedTickCount} ticks (${(trackedTickCount / 20).toFixed(0)} seconds).`,
            onEnableCallback: () => this.#subscribeToEvents(),
            onDisableCallback: () => this.#unsubscribeFromEvents()
        };
        super(ruleData, displayLine);
        this.player = player;
        this.#trackedTickCount = trackedTickCount;
        this.onPlayerBreakBlockBound = this.#onPlayerBreakBlock.bind(this);
    }

    getFormattedDataOwnLine() {
        return { translate: `rules.infoDisplay.blockBreakSpeed.display`, with: [String(this.#getAverageBlocksBrokenPerSecond().toFixed(1))] };
    }

    getFormattedDataSharedLine() {
        return { text: `§cBlockBreakSpeed should always be on its own InfoDisplay line.§r` };
    }

    #subscribeToEvents() {
        world.afterEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlockBound);
        this.#runner = system.runInterval(this.#onTick.bind(this));
    }

    #unsubscribeFromEvents() {
        world.afterEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlockBound);
        if (this.#runner) {
            system.clearRun(this.#runner);
            this.#runner = void 0;
        }
    }

    #onTick() {
        if (!this.#blockWasBrokenThisTick())
            this.#blockBrokenHistory.push(false);
        if (this.#blockBrokenHistory.length > this.#trackedTickCount)
            this.#blockBrokenHistory.shift();
    }

    #onPlayerBreakBlock(event) {
        if (event.player?.id !== this.player.id)
            return;
        this.#blockBrokenHistory.push(system.currentTick);
    }

    #blockWasBrokenThisTick() {
        return this.#blockBrokenHistory[this.#blockBrokenHistory.length - 1] === system.currentTick;
    }

    #getAverageBlocksBrokenPerSecond() {
        const blocksBrokenInTrackedTicks = this.#blockBrokenHistory.filter(tick => tick !== false).length;
        const secondsElapsed = this.#blockBrokenHistory.length / TicksPerSecond;
        return blocksBrokenInTrackedTicks / secondsElapsed;
    }
}
