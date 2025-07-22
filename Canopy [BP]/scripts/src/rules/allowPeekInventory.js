import { GlobalRule } from '../../lib/canopy/Canopy';
import { world, EntityComponentTypes, system } from '@minecraft/server';
import { InventoryUI } from '../classes/InventoryUI';

class AllowPeekInventory extends GlobalRule {
    peekItemId = 'minecraft:spyglass';

    constructor() {
        super({
            identifier: 'allowPeekInventory',
            onEnableCallback: () => this.subscribeToEvents(),
            onDisableCallback: () => this.unsubscribeFromEvents()
        });
        this.onPlayerInteractionBound = this.onPlayerInteraction.bind(this);
    }

    subscribeToEvents() {
        world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractionBound);
        world.beforeEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractionBound);
    }

    unsubscribeFromEvents() {
        world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractionBound);
        world.beforeEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractionBound);
    }

    onPlayerInteraction(event) {
        if (!event.player || event.itemStack?.typeId !== this.peekItemId) return;
        const target = event.block || event.target;
        if (!this.hasInventory(target)) return;
        event.cancel = true;
        const invUI = new InventoryUI(target);
        system.run(() => {
            invUI.show(event.player);
        });
    }

    hasInventory(target) {
        return target?.getComponent(EntityComponentTypes.Inventory) !== undefined;
    }
}

export const allowPeekInventory = new AllowPeekInventory();