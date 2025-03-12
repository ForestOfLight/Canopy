import { Rule, Rules } from '../../lib/canopy/Canopy';
import { world } from '@minecraft/server';
import { showInventoryUI } from '../commands/peek';

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
    const player = event.player;
    if (!player || !event.itemStack?.typeId === peekItem) return;
    const target = event.block || event.target;
    if (!target || !target.getComponent('inventory')) return;
    showInventoryUI(player, target, target.getComponent('inventory'));
}