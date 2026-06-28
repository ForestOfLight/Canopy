import { InfoDisplayShapeElement } from './InfoDisplayShapeElement';
import { BlockVolume, LiquidType } from '@minecraft/server';
import { LightLevelRenderer } from '../../classes/LightLevelRenderer';
import { Vector } from '../../../lib/Vector';

class RenderLightLevel extends InfoDisplayShapeElement {
    player;
    playerId;
    static RENDER_DISTANCE = 4;
    signalStrengthRenderers = {};

    constructor(player) {
        const ruleData = {
            identifier: 'renderLightLevel',
            description: { translate: 'rules.infoDisplay.renderLightLevel' },
            wikiDescription: `Renders the light level of nearby blocks in the world. Only renders for blocks within ${RenderLightLevel.RENDER_DISTANCE} blocks from the player to avoid excessive rendering. Warning: This rule can be very laggy.`,
            onEnableCallback: () => this.start(),
            onDisableCallback: () => this.stop()
        };
        super(ruleData, 0);
        this.player = player;
        this.playerId = player.id;
    }

    start() {
        this.lightLevelRenderers = {};
    }

    stop() {
        for (const [key, renderer] of Object.entries(this.lightLevelRenderers)) {
            renderer.destroy();
            delete this.lightLevelRenderers[key];
        }
        this.lightLevelRenderers = {};
    }

    onTick() {
        this.renderForNearbyBlocks();
    }

    renderForNearbyBlocks() {
        const dimension = this.player.dimension;
        const lightLevelRendererKeys = Object.keys(this.lightLevelRenderers);
        const blockKeys = [];
        const blockLocationIterator = this.getNearbyBlockLocationIterator(dimension, this.player.location);
        let locationResult = blockLocationIterator.next();
        while (!locationResult.done) {
            const block = dimension.getBlock(locationResult.value);
            const blockAbove = block.above();
            if ((blockAbove.isSolid || blockAbove.isLiquidBlocking(LiquidType.Water)) || !block.isLiquidBlocking(LiquidType.Water)) {
                locationResult = blockLocationIterator.next();
                continue;
            }
            const key = this.getKey(block);
            blockKeys.push(key);
            if (!lightLevelRendererKeys.includes(key))
                this.lightLevelRenderers[key] = new LightLevelRenderer(blockAbove, dimension, this.player);
            locationResult = blockLocationIterator.next();
        }
        for (const [key, renderer] of Object.entries(this.lightLevelRenderers)) {
            if (!blockKeys.includes(key)) {
                renderer.destroy();
                delete this.lightLevelRenderers[key];
            }
        }
    }

    getNearbyBlockLocationIterator(dimension, location) {
        const locationVector = Vector.from(location);
        const min = locationVector.subtract(new Vector(RenderLightLevel.RENDER_DISTANCE, RenderLightLevel.RENDER_DISTANCE, RenderLightLevel.RENDER_DISTANCE));
        const max = locationVector.add(new Vector(RenderLightLevel.RENDER_DISTANCE, 1, RenderLightLevel.RENDER_DISTANCE));
        const volume = new BlockVolume(min, max);
        const blockVolume = dimension.getBlocks(volume, { excludeTypes: ["minecraft:air", "minecraft:water", "minecraft:lava"] }, true);
        return blockVolume.getBlockLocationIterator();
    }

    getKey(block) {
        return `<${block.x}, ${block.y}, ${block.z}>`;
    }
}

export { RenderLightLevel };
