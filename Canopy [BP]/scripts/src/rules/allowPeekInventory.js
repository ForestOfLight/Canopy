import { Rule, Rules } from '../../lib/canopy/Canopy';
import { system, world } from '@minecraft/server';
import { showInventoryUI } from '../commands/peek';
import { parseName } from '../../include/utils';

const peekItem = 'minecraft:spyglass';

new Rule({
    category: 'Rules',
    identifier: 'allowPeekInventory',
    description: { translate: 'rules.allowPeekInventory' },
    onEnableCallback: () => {
        world.beforeEvents.playerInteractWithBlock.subscribe(onPlayerInteraction);
        world.beforeEvents.playerInteractWithEntity.subscribe(onPlayerInteraction);
    },
    onDisableCallback: () => {
        world.beforeEvents.playerInteractWithBlock.unsubscribe(onPlayerInteraction);
        world.beforeEvents.playerInteractWithEntity.unsubscribe(onPlayerInteraction);
    }
});

function onPlayerInteraction(event) {
    if (!Rules.getNativeValue('allowPeekInventory')) return;
    if (!event.player || event.itemStack?.typeId !== peekItem) return;
    let target = event.block || event.target;
    const inventory = target?.getComponent('inventory');
    if (!inventory) return;
    event.cancel = true;
    const targetData = {
        name: parseName(target),
        entity: target
    };
    system.run(() => {
        showInventoryUI(event.player, targetData, inventory);
    });
}