import * as mc from '@minecraft/server';

mc.world.beforeEvents.explosion.subscribe(ev => {
    if (mc.world.getDynamicProperty('noTntExplode')) {
        ev.cancel = true;
    }
});