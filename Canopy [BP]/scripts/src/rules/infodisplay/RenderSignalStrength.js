import { BlockVolume, system } from '@minecraft/server';
import { InfoDisplayElement } from './InfoDisplayElement';
import { SignalStrengthRenderer } from '../../classes/SignalStrengthRenderer';
import { Vector } from '../../../lib/Vector';

class RenderSignalStrength extends InfoDisplayElement{
    player;
    playerId;
    RENDER_DISTANCE = 8;
    signalStrengthRenderers = new Map();
    runner = void 0;

    constructor(player) {
        const ruleData = {
            identifier: 'renderSignalStrength',
            description: { translate: 'rules.infoDisplay.renderSignalStrength' },
            onEnableCallback: () => this.startRendering(),
            onDisableCallback: () => this.stopRendering()
        };
        super(ruleData, 0);
        this.player = player;
        this.playerId = player.id;
    }

    startRendering() {
        if (this.runner !== void 0)
            this.stopRendering();
        this.signalStrengthRenderers = new Map();
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    stopRendering() {
        if (this.runner !== void 0) {
            system.clearRun(this.runner);
            this.runner = void 0;
        }
        if (this.signalStrengthRenderers.size > 0) {
            for (const renderer of this.signalStrengthRenderers.values())
                renderer.destroy();
            this.signalStrengthRenderers.clear();
        }
    }

    refresh() {
        this.stopRendering();
        this.startRendering();
    }

    onTick() {
        if (this.player)
            this.renderForNearbyBlocks();
        else
            this.stopRendering();
    }

    renderForNearbyBlocks() {
        const blockLocationIterator = this.getNearbyBlockLocationIterator();
        let locationResult = blockLocationIterator.next();
        const blocks = [];
        while (!locationResult.done) {
            const block = this.player.dimension.getBlock(locationResult.value);
            blocks.push(block);
            const key = Vector.from(block.location).toString();
            if (!this.signalStrengthRenderers.has(key))
                this.signalStrengthRenderers.set(key, new SignalStrengthRenderer(block, this.player));
            locationResult = blockLocationIterator.next();
        }
        for (const [key, renderer] of this.signalStrengthRenderers) {
            if (!blocks.some(e => e.id === renderer.block.id)) {
                renderer.destroy();
                this.signalStrengthRenderers.delete(key);
            }
        }
    }

    getNearbyBlockLocationIterator() {
        const min = Vector.from(this.player.location).subtract(new Vector(this.RENDER_DISTANCE, this.RENDER_DISTANCE, this.RENDER_DISTANCE));
        const max = Vector.from(this.player.location).add(new Vector(this.RENDER_DISTANCE, 2, this.RENDER_DISTANCE));
        const volume = new BlockVolume(min, max);
        const blockVolume = this.player.dimension.getBlocks(volume, { includeTypes: ["minecraft:redstone_wire"] }, true);
        return blockVolume.getBlockLocationIterator();
    }

    getFormattedDataOwnLine() {
        this.onTick();
        return { text: '' };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export { RenderSignalStrength };
