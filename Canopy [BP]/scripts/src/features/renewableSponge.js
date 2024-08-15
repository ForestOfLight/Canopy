import { world } from '@minecraft/server';

world.afterEvents.entityHurt.subscribe(event => {
    if (event.hurtEntity.typeId !== 'minecraft:guardian' || !world.getDynamicProperty('renewableSponge') || event.damageSource.cause !== 'lightning') 
        return;

    const guardian = event.hurtEntity;
    guardian.dimension.spawnEntity('minecraft:elder_guardian', guardian.location);
    guardian.remove();
});