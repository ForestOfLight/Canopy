import { InfoDisplayShapeElement } from './InfoDisplayShapeElement';
import { BlockVolume } from '@minecraft/server';
import { SignalStrengthRenderer } from '../../classes/SignalStrengthRenderer';
import { Vector } from '../../../lib/Vector';

class RenderSignalStrength extends InfoDisplayShapeElement {
    player;
    playerId;
    static RENDER_DISTANCE = 10;
    signalStrengthRenderers = {};

    constructor(player) {
        const ruleData = {
            identifier: 'renderSignalStrength',
            description: { translate: 'rules.infoDisplay.renderSignalStrength' },
            wikiDescription: `Renders the signal strength of nearby redstone dust in the world. Only renders for redstone dust within ${RenderSignalStrength.RENDER_DISTANCE} blocks from the player to avoid excessive rendering.`,
            onEnableCallback: () => this.startRender(),
            onDisableCallback: () => this.stopRender()
        };
        super(ruleData, 0);
        this.player = player;
        this.playerId = player.id;
    }

    startRender() {
        this.signalStrengthRenderers = {};
    }

    stopRender() {
        for (const [key, renderer] of Object.entries(this.signalStrengthRenderers)) {
            renderer.destroy();
            delete this.signalStrengthRenderers[key];
        }
        this.signalStrengthRenderers = {};
    }

    onTick() {
        this.renderForNearbyBlocks();
    }

    renderForNearbyBlocks() {
        const dimension = this.player.dimension;
        const signalStrengthRendererKeys = Object.keys(this.signalStrengthRenderers);
        const blockKeys = [];
        const blockLocationIterator = this.getNearbyBlockLocationIterator(dimension, this.player.location);
        let locationResult = blockLocationIterator.next();
        while (!locationResult.done) {
            const block = dimension.getBlock(locationResult.value);
            const key = this.getKey(block);
            blockKeys.push(key);
            if (!signalStrengthRendererKeys.includes(key))
                this.signalStrengthRenderers[key] = new SignalStrengthRenderer(block, dimension, this.player);
            locationResult = blockLocationIterator.next();
        }
        for (const [key, renderer] of Object.entries(this.signalStrengthRenderers)) {
            if (!blockKeys.includes(key)) {
                renderer.destroy();
                delete this.signalStrengthRenderers[key];
            }
        }
    }

    getNearbyBlockLocationIterator(dimension, location) {
        const locationVector = Vector.from(location);
        const min = locationVector.subtract(new Vector(RenderSignalStrength.RENDER_DISTANCE, RenderSignalStrength.RENDER_DISTANCE, RenderSignalStrength.RENDER_DISTANCE));
        const max = locationVector.add(new Vector(RenderSignalStrength.RENDER_DISTANCE, 2, RenderSignalStrength.RENDER_DISTANCE));
        const volume = new BlockVolume(min, max);
        const blockVolume = dimension.getBlocks(volume, { includeTypes: ["minecraft:redstone_wire"] }, true);
        return blockVolume.getBlockLocationIterator();
    }

    getKey(block) {
        return `<${block.x}, ${block.y}, ${block.z}>`;
    }
}

export { RenderSignalStrength };
