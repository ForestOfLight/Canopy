import { GlobalRule } from '../../lib/canopy/Canopy';
import { world, EntityComponentTypes } from '@minecraft/server';
import { InventoryUI } from '../classes/InventoryUI';

class AllowPeekInventory extends GlobalRule {
    peekItemId = 'minecraft:spyglass';

    constructor() {
        super({
            identifier: 'allowPeekInventory',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        });
        this.onPlayerInteractionBound = this.onPlayerInteraction.bind(this);
    }

    subscribeToEvent() {
        console.warn('[Canopy] AllowPeekInventory rule is enabled. Players can peek inventories using a spyglass.');
        world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractionBound);
        world.beforeEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractionBound);
    }

    unsubscribeFromEvent() {
        console.warn('[Canopy] AllowPeekInventory rule is disabled.');
        world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractionBound);
        world.beforeEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractionBound);
    }

    onPlayerInteraction(event) {
        if (!event.player || event.itemStack?.typeId !== this.peekItemId) return;
        const target = event.block || event.target;
        if (!this.hasInventory(target)) return;
        event.cancel = true;
        const invUI = new InventoryUI(target);
        invUI.show(event.player);
    }

    hasInventory(target) {
        return target?.getComponent(EntityComponentTypes.Inventory) !== undefined;
    }
}

export const allowPeekInventory = new AllowPeekInventory();