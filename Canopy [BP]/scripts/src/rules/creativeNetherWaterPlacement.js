import { GlobalRule } from "../../lib/canopy/Canopy";
import { world, GameMode, system, Direction, LiquidType } from '@minecraft/server';

class CreativeNetherWaterPlacement extends GlobalRule {
    constructor() {
        super({
            identifier: 'creativeNetherWaterPlacement',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        });
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
    }

    subscribeToEvent() {
        world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound);
    }

    unsubscribeFromEvent() {
        world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound);
    }

    onPlayerInteractWithBlock(event) {
        const player = event.player;
        if (player &&
            player.getGameMode() === GameMode.Creative &&
            player.dimension.id === 'minecraft:nether' &&
            event.itemStack?.typeId === 'minecraft:water_bucket'
        ) {
            system.run(() => {
                if (event.block.canContainLiquid(LiquidType.Water)) 
                    this.waterlog(event.block);
                else
                    this.setWater(this.getBlockLocationFromFace(event.block, event.blockFace));
            });
        }
    }

    getBlockLocationFromFace(block, face) {
        const faceToBlockMap = {
            [Direction.Up]: block.above(),
            [Direction.Down]: block.below(),
            [Direction.North]: block.north(),
            [Direction.South]: block.south(),
            [Direction.West]: block.west(),
            [Direction.East]: block.east()
        };
        return faceToBlockMap[face];
    }

    setWater(block) {
        block.setType('minecraft:water');
    }

    waterlog(block) {
        block.setWaterlogged(true);
    }
}

export const creativeNetherWaterPlacement = new CreativeNetherWaterPlacement();