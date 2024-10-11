import { Rule } from 'lib/canopy/Canopy';
import { world, system } from '@minecraft/server';

new Rule({
    category: 'Rules',
    identifier: 'allowBubbleColumnPlacement',
    description: 'Removes the restriction on placing bubble columns.'
});

world.beforeEvents.playerPlaceBlock.subscribe((event) => {
    if (!event.player || !Rule.getNativeValue('allowBubbleColumnPlacement')) return;
    system.run(() => {
        if (event.player.getComponent('equippable').getEquipment('Mainhand').typeId === 'minecraft:bubble_column') {
            world.structureManager.place('mystructure:bubble_column', event.dimension, event.block.location);
        }
    });
});