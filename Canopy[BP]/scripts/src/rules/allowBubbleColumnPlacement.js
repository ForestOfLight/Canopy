import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { world, system } from '@minecraft/server';

class AllowBubbleColumnPlacement extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'allowBubbleColumnPlacement',
            wikiDescription: 'Removes the vanilla restriction on placing bubble column items. A soul sand or magma block underneath is still required.',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        }));
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
            if (event.permutationToPlace.type.id === 'minecraft:bubble_column')
                this.placeBubbleColumn(event.dimension, event.block.location);
        });
    }

    placeBubbleColumn(dimension, location) {
        world.structureManager.place('mystructure:bubble_column', dimension, location);
    }
}

export const allowBubbleColumnPlacement = new AllowBubbleColumnPlacement();