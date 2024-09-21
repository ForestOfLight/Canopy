import { world } from '@minecraft/server';
import { Rule } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'beeNoDrown',
    description: 'Enables bees healing from drowning damage.'
});

world.afterEvents.entityHurt.subscribe(event => {
    if (event.hurtEntity?.typeId !== 'minecraft:bee' || event.damageSource.cause !== 'drowning') return;
    const healthComponent = event.hurtEntity.getComponent('minecraft:health')
    healthComponent.setCurrentValue(healthComponent.currentValue + event.damage);
});