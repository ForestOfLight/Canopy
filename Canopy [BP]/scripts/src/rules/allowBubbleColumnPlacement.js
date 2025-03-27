import { GlobalRule } from "../../lib/canopy/Canopy";
import { world, system } from '@minecraft/server';

class AllowBubbleColumnPlacement extends GlobalRule {
    constructor() {
        super({
            identifier: 'allowBubbleColumnPlacement',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        });
        this.onPlayerPlaceBlockBound = this.onPlayerPlaceBlock.bind(this);
    }

    subscribeToEvent() {
        world.beforeEvents.playerPlaceBlock.subscribe(this.onPlayerPlaceBlockBound);
    }

    unsubscribeFromEvent() {
        world.beforeEvents.playerPlaceBlock.unsubscribe(this.onPlayerPlaceBlockBound);
    }

    onPlayerPlaceBlock(event) {
        if (!event.player) return;
        system.run(() => {
            if (this.hasBubbleColumnInMainhand(event))
                this.placeBubbleColumn(event.dimension, event.block.location);
        });
    }

    hasBubbleColumnInMainhand(event) {
        return event.player.getComponent('equippable').getEquipment('Mainhand')?.typeId === 'minecraft:bubble_column';
    }

    placeBubbleColumn(dimension, location) {
        world.structureManager.place('mystructure:bubble_column', dimension, location);
    }
}

export const allowBubbleColumnPlacement = new AllowBubbleColumnPlacement();